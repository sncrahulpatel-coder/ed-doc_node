
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import archiver from "archiver";

const urlCache = new Map();

const s3 = new S3Client({
  region: process.env.AWS_REGION
});

const sesClient = new SESClient({
  region: process.env.AWS_REGION,
});

// ✅ Get pre-signed upload URL
export async function getUploadUrl_aws({ fileName, fileType, folder_name, UniqueFileName }) {
  if (!fileName) throw new Error("fileName required");
  if (!fileType) throw new Error("fileType required");
  if (!UniqueFileName) throw new Error("UniqueFileName required");

 if (!(fileType.startsWith("image/") || fileType.includes("pdf"))) {
    throw new Error("Only images or PDF files are allowed");
}

  const ext = path.extname(fileName) || ".bin";
  const safeFileName = String(UniqueFileName || "unknown").replace(/[^a-zA-Z0-9-_]/g, "-");

  const key = `${process.env.isProd === "true" ? "" : "test/"}${folder_name}/${safeFileName+ext}`;

  const cmd = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: fileType
  });

  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 });
  return { uploadUrl, key };
}

// ✅ Get pre-signed upload URL
export async function getUploadUrl_aws_policy({ fileName, fileType }) {
  if (!fileName) throw new Error("fileName required");
  if (!fileType) throw new Error("fileType required");

  if (!fileType.startsWith("image/")) throw new Error("Only images allowed");

  const safeText = Date.now();

  const key = `${process.env.isProd === "true" ? "" : "test/"}SchemePolicy/${safeText}.png`;

  const cmd = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: fileType
  });

  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 });
  return { uploadUrl, key };
}

// ✅ Get pre-signed view URL
export async function getViewUrl_aws(key) {
  if (!key) throw new Error("key required");

  const cmd = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key
  });

  return await getSignedUrl(s3, cmd, { expiresIn: 600 });
}

export async function getViewUrl_aws_download(key) {
  if (!key) throw new Error("key required");

  const fileName = key.split("/").pop(); // optional

  const cmd = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,

    // 🔥 This forces download
    ResponseContentDisposition: `attachment; filename="${fileName}"`,
  });

  return await getSignedUrl(s3, cmd, { expiresIn: 600 });
}

export async function getDownloadUrl_aws(key) {
  const fileName = key.split("/").pop();

  const cmd = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${fileName}"`
  });

  return await getSignedUrl(s3, cmd, { expiresIn: 600 });
}

// ✅ Cached view URL
export async function getCachedViewUrl(key) {
  // if (process.env.isProd !== "true") {
  //   return "/aws.png";
  // }

  const now = Date.now();
  const cached = urlCache.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.url;
  }

  const url = await getViewUrl_aws(key);
  urlCache.set(key, { url, expiresAt: now + 600_000 }); // 10 min
  return url;
}

export async function sendMail(to, subject, body) {
  if (!to) throw new Error("Parameter 'to' is required");
  if (!subject) throw new Error("Parameter 'subject' is required");
  if (!body) throw new Error("Parameter 'body' is required");
  console.log(process.env.isProd)

  if (process.env.isProd == 'false') {
    console.error('-----------------------------------------------')
    console.error('------------- Mail Send ------------------');
    console.error("To: " + to);
    console.error("Subject: " + subject);
    console.error("Body: " + body);
    console.error('-----------------------------------------------')
    return 0;
  }

  const cc = ['snc.rahulpatel@gmail.com'];

  const params = {
    Destination: {
      ToAddresses: [to],
      ...(cc.length ? { CcAddresses: Array.isArray(cc) ? cc : [cc] } : {}),
    },
    Message: {
      Body: {
        Html: {
          Data: body,
          Charset: "UTF-8",
        },
      },
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
    },

    Source: 'admin@info.snckids.in', // Your verified sender email or domain
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    return response; // Contains MessageId and response metadata
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}


export async function deleteDoc_aws(key) {
  if (!key) throw new Error("key required");

  const cmd = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key
  });

  try {
    await s3.send(cmd);
    return true; // Deleted successfully
  } catch (err) {
    console.error("AWS Delete Error:", err);
    throw err;
  }
}


// ✅ Get total folder size in bytes
export async function getFolderSize_aws(prefix) {

  prefix = `${process.env.isProd === "true" ? "" : "test/" }${prefix}`
  console.log(prefix);
  if (!prefix) throw new Error("Prefix (folder key) required");

  const bucket = process.env.S3_BUCKET;
  let totalSize = 0;
  let continuationToken = undefined;

  try {
    while (true) {
      const params = {
        Bucket: bucket,
        Prefix: prefix.endsWith("/") ? prefix : prefix + "/", // ensure folder format
        ContinuationToken: continuationToken
      };

      const cmd = new ListObjectsV2Command(params);
      const res = await s3.send(cmd);

      if (res.Contents) {
        for (const obj of res.Contents) {
          totalSize += obj.Size || 0;
        }
      }

      if (!res.IsTruncated) break; // no more pages
      continuationToken = res.NextContinuationToken;
    }

    return totalSize; // in bytes
  } catch (err) {
    console.error("Error getting folder size:", err);
    throw err;
  }
}
export async function downloadMultipleFromS3(files, res) {
  if (!files || files.length === 0) {
    throw new Error("No S3 files provided");
  }

  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Documents_${Date.now()}.zip`
  );

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(res);

  const usedNames = new Set();  // ⭐ track duplicate names

  for (const file of files) {
    const key = file.o_url;
    const title = file.title || "Document";

    const cmd = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    });

    const s3Response = await s3.send(cmd);
    const fileStream = s3Response.Body;

    const ext = key.split('.').pop();

    let finalName = `${title}.${ext}`;

    // ⭐ check duplicates
    let counter = 1;
    while (usedNames.has(finalName)) {
      finalName = `${title}(${counter}).${ext}`;
      counter++;
    }

    usedNames.add(finalName);

    archive.append(fileStream, { name: finalName });
  }

  await archive.finalize();
}


export async function uploadBufferToS3({
  buffer,
  folder,
  contentType = "image/png",
  extension = ".png"
}) {
  const fileName = `scan_${uuidv4()}${extension}`
  const key = `${process.env.isProd === "true" ? "" : "test/"}${folder}/${fileName}`

  const cmd = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType
  })

  await s3.send(cmd)
  return key
}