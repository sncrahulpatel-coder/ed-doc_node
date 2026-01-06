import { createCanvas, loadImage } from "canvas"
import fs from "fs"
import { uploadBufferToS3 } from "../aws/aws3.js"

function normalizeKey(str) {
  return str.replace(/\u00A0/g, " ").trim().toLowerCase()
}

export default async function fillTemplate(aws_url, fields, values,user_id) {
//   console.log("Fill Template")

  // 🔥 FIX: parse JSON string
  if (typeof values === "string") {
    values = JSON.parse(values)
  }

  const image = await loadImage(aws_url)
  const canvas = createCanvas(image.width, image.height)
  const ctx = canvas.getContext("2d")

  ctx.drawImage(image, 0, 0)

  ctx.font = "22px sans-serif"
  ctx.fillStyle = "#000"
  ctx.textBaseline = "middle"

  // normalize values
  const normalizedValues = {}
  for (const key in values) {
    normalizedValues[normalizeKey(key)] = values[key]
  }

//   console.log("Normalized Values:", normalizedValues)

  fields.forEach(field => {
    const value = normalizedValues[normalizeKey(field.id)]
    if (!value) return

    ctx.fillText(
      String(value),
      field.x + 4,
      field.y + field.height / 2
    )
  })

//   fs.writeFileSync("./output.png", canvas.toBuffer("image/png"))
const buffer = canvas.toBuffer("image/png")

  const s3Key = await uploadBufferToS3({
    buffer,
    folder: 'school_' + user_id,
    contentType: "image/png"
  })

  console.log(s3Key)
  return  s3Key
}
