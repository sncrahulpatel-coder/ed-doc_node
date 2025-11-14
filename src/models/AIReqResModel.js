import createResponse from "../ChatGPT/chatGPT.js";
import getPromptSchema from "../ChatGPT/promptSchema.js";
import pool from "../config/db/db_config.js"; // PostgreSQL connection pool


export const AIReqResModel = {

  async sendOpinion(individual_student,opinion,serviceId,title="",title_desc="") {

    if (!opinion) {
      throw new Error("Opinion required");
    }

    const {prompt,schema} = getPromptSchema(serviceId, opinion,title,title_desc);

    const ai_responce = await createResponse(prompt, schema);
    const AiJsonData = ai_responce.json;
    const resJsonValided = ai_responce.match;

        const query = `
      INSERT INTO ai_req_res (
      api_responce_id,
      type,
      api_status,
      prompt,
      res_content,
      json_validate_status,token_usages,errors,json_data,individual_student)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *;
    `;

    const result = await pool.query(query, [ai_responce.gptId,ai_responce.type,ai_responce.status,prompt,ai_responce.content,resJsonValided,JSON.stringify(ai_responce.usage), JSON.stringify(ai_responce.errors), AiJsonData,individual_student]);

      return {ai_req_res:result.rows[0].id}
  },

};
