import OpenAI from 'openai';
import Ajv from 'ajv';
import fs from "fs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


export async function createResponse(prompt, schema) {
  try {
    const resp = await client.responses.create({
      model: 'gpt-4o-mini',
      input: prompt
    });


    let aiResponseContent = "";
    if (resp.output && Array.isArray(resp.output)) {
      for (const item of resp.output) {
        if (item.type === 'message') {
          aiResponseContent += item.content[0].text;
        }
      }
    }

    // console.log("Raw AI Response Content:-------------------------------------------------------------------");
    // console.log(aiResponseContent);
    // console.log("-------------------------------------------------------------------");

    const result = await extractAndValidateJson(aiResponseContent, schema);
    const perfectResult = { ...result, gptId: resp.id, usage: resp.usage, status: resp.status, type: resp.model, content: aiResponseContent };
    // console.log("Final Parsed + Validated Result:");
    // console.log(perfectResult);

    return perfectResult;

  } catch (err) {
    console.error('API error:', err);
  }
}

async function extractAndValidateJson(aiResponseContent, schema) {
  // Extract JSON block (```json ... ```)
  const match = aiResponseContent.match(/```json\s*([\s\S]*?)```/);
  let extractedJson;

  try {
    extractedJson = match ? JSON.parse(match[1]) : JSON.parse(aiResponseContent);
  } catch (e) {
    // fallback to empty object if parse fails
    extractedJson = {};
  }

  // Auto-correct common typos
  if (extractedJson.engagement_persentage !== undefined) {
    extractedJson.engagement_percentage = extractedJson.engagement_persentage;
    delete extractedJson.engagement_persentage;
  }

  // Ensure all required fields exist with defaults
  const defaults = {
    learning_badge: [],
    activity_badge: [],
    outcome_badge: [],
    engagement_percentage: 0,
    level_list: {
      Observing: "",
      Responding: "",
      Initiative: "",
      Contributing: ""
    }

  };

  extractedJson = { ...defaults, ...extractedJson };

  // Validate with AJV
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  const valid = validate(extractedJson);

  return {
    match: valid ? true : false, // always true now
    json: extractedJson,
    errors: valid ? null : validate.errors
  };
}

export async function extractFormFields(filePath) {
  const imageBase64 = fs.readFileSync(filePath, {
    encoding: "base64",
  });

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    temperature: 0,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: "You are an OCR and data-extraction assistant. Return valid JSON only."
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `
Extract the following fields from the document image.
If a field is missing, return null.
Return JSON only.

Fields:
- student_name
- father_name
- mother_name
- religion
- date_of_birth
- date_of_withdrawal
- general_conduct
- uid_no
- date_of_issue
`
          },
          {
            type: "input_image",
            image_url: `data:image/jpeg;base64,${imageBase64}`
          }
        ]
      }
    ]
  });

  const result = response.output_text;
const clean = cleanJson(result);

console.log(clean);
return JSON.parse(clean);
}

export async function extractFormFields_aws(imageUrl,fields) {

 const response = await client.responses.create({
    model: "gpt-4.1-mini",
    temperature: 0,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: "You are an OCR and data-extraction assistant. Return valid JSON only."
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `
Extract the following fields from the document image.
If a field is missing, return null.
Return JSON only.

Fields:
- ${fields.split(",").join("\n- ")}
`
          },
          {
            type: "input_image",
            image_url: imageUrl
          }
        ]
      }
    ]
  });

  const result = response.output_text;
const clean = cleanJson(result);

console.log(clean);
return JSON.parse(clean);
}

function cleanJson(text) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}