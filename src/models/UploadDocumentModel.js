import pool from "../config/db/db_config.js"; // PostgreSQL connection pool

export const UploadDocumentModel = {
  /**
   * Create Upload Document with validation
   */
  async createDocument(data) {
    // ✅ Required fields
    if (!data.school_id) throw new Error("Missing required field: school_id");
    if (!data.school_template_id)
      throw new Error("Missing required field: school_template_id");
    if (!data.ai_res) throw new Error("Missing required field: ai_res");
    if (!data.original_file)
      throw new Error("Missing required field: original_file");
    if (!data.template_file)
      throw new Error("Missing required field: template_file");
    if (!data.status) throw new Error("Missing required field: status");

    // ✅ Validate values
    if (!Number.isInteger(data.school_id)) {
      throw new Error("Invalid school_id (must be integer)");
    }

    if (
      data.template_fields &&
      typeof data.template_fields !== "object"
    ) {
      throw new Error("Invalid template_fields (must be JSON object)");
    }

    if (typeof data.ai_res !== "string" || data.ai_res.length > 255) {
      throw new Error("Invalid ai_res (must be string, max 255 chars)");
    }

    if (
      typeof data.original_file !== "string" ||
      data.original_file.length > 255
    ) {
      throw new Error(
        "Invalid original_file (must be string, max 255 chars)"
      );
    }

    if (
      typeof data.template_file !== "string" ||
      data.template_file.length > 255
    ) {
      throw new Error(
        "Invalid template_file (must be string, max 255 chars)"
      );
    }

    if (typeof data.status !== "string" || data.status.length > 255) {
      throw new Error("Invalid status (must be string, max 255 chars)");
    }

    // Convert JSON fields
    if (data.template_fields) {
      data.template_fields = JSON.stringify(data.template_fields);
    }

    // ✅ Allowed columns only
    const allowedColumns = [
      "school_id",
      "school_template_id",
      "template_fields",
      "ai_res",
      "original_file",
      "template_file",
      "status"
    ];

    const columns = Object.keys(data).filter(col =>
      allowedColumns.includes(col)
    );

    const values = columns.map(col => data[col]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");

    const query = `
      INSERT INTO upload_document (${columns.join(", ")})
      VALUES (${placeholders})
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  /**
   * Get Document by ID
   */
  async findById(document_id) {
    if (!Number.isInteger(document_id)) {
      throw new Error("Invalid document_id");
    }

    const query = `
      SELECT *
      FROM upload_document
      WHERE document_id = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [document_id]);
    return result.rows[0];
  },

  async findByIds(document_ids) {
    if (!Array.isArray(document_ids)) {
      throw new Error("Invalid document_ids");
    }

    const query = `
      SELECT *
      FROM upload_document
      WHERE document_id = ANY($1)
    `;

    const result = await pool.query(query, [document_ids]);
    return result.rows;
  },


  /**
   * Get Documents by School ID
   */
  async findBySchoolId(school_id) {
    if (!Number.isInteger(school_id)) {
      throw new Error("Invalid school_id");
    }

    const query = `
      select * from upload_document ud left join school_template st on ud.school_template_id = st.school_template_id
 WHERE ud.school_id = $1
      ORDER BY ud.created_at DESC
    `;

    const result = await pool.query(query, [school_id]);
    return result.rows;
  },

  /**
   * Update Document
   */
  async updateDocument(document_id, data) {
    if (!Number.isInteger(document_id)) {
      throw new Error("Invalid document_id");
    }

    const allowedColumns = [
      "template_fields",
      "ai_res",
      "original_file",
      "template_file",
      "status"
    ];

    const columns = Object.keys(data).filter(col =>
      allowedColumns.includes(col)
    );

    if (columns.length === 0) {
      throw new Error("No valid fields to update");
    }

    // Convert JSON fields if present
    if (data.template_fields) {
      if (typeof data.template_fields !== "object") {
        throw new Error("Invalid template_fields (must be JSON object)");
      }
      data.template_fields = JSON.stringify(data.template_fields);
    }

    const setClause = columns
      .map((col, i) => `${col} = $${i + 1}`)
      .join(", ");

    const values = columns.map(col => data[col]);

    const query = `
      UPDATE upload_document
      SET ${setClause},
          updated_at = NOW()
      WHERE document_id = $${columns.length + 1}
      RETURNING *;
    `;

    const result = await pool.query(query, [
      ...values,
      document_id
    ]);

    return result.rows[0];
  },

  /**
   * Delete Document
   */
  async deleteDocument(document_id) {
    if (!Number.isInteger(document_id)) {
      throw new Error("Invalid document_id");
    }

    const query = `
      DELETE FROM upload_document
      WHERE document_id = $1
      RETURNING *;
    `;

    const result = await pool.query(query, [document_id]);
    return result.rows[0];
  }
};
