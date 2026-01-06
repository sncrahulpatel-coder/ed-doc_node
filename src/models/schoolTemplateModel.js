import pool from "../config/db/db_config.js"; // PostgreSQL connection pool

export const SchoolTemplateModel = {
  /**
   * Create School Template with validation
   */
  async createTemplate(data) {
    // ✅ Required fields
    if (!data.school_id) throw new Error("Missing required field: school_id");
    if (!data.name) throw new Error("Missing required field: name");
    if (!data.url) throw new Error("Missing required field: url");

    // ✅ Validate values
    if (!Number.isInteger(data.school_id)) {
      throw new Error("Invalid school_id (must be integer)");
    }

    if (typeof data.name !== "string" || data.name.length > 255) {
      throw new Error("Invalid name (must be string, max 255 chars)");
    }

    if (typeof data.url !== "string" || data.url.length > 255) {
      throw new Error("Invalid url (must be string, max 255 chars)");
    }

    if (data.fields && typeof data.fields !== "object") {
      throw new Error("Invalid fields (must be JSON object)");
    }
    data.fields = JSON.stringify(data.fields);
    // ✅ Allowed columns only
    const allowedColumns = ["school_id", "name", "url", "fields"];
    const columns = Object.keys(data).filter(col =>
      allowedColumns.includes(col)
    );

    const values = columns.map(col => data[col]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");

    // ✅ Secure query
    const query = `
      INSERT INTO school_template (${columns.join(", ")})
      VALUES (${placeholders})
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  /**
   * Get Template by ID
   */
  async findById(school_template_id) {

    const query = `
      SELECT *
      FROM school_template
      WHERE school_template_id = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [school_template_id]);
    return result.rows[0];
  },

  /**
   * Get Templates by School ID
   */
  async findBySchoolId(school_id) {
    if (!Number.isInteger(school_id)) {
      throw new Error("Invalid school_id");
    }

    const query = `
      SELECT *
      FROM school_template
      WHERE school_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [school_id]);
    return result.rows;
  },

  /**
   * Update Template
   */
  async updateTemplate(school_template_id, data) {
    if (!Number.isInteger(school_template_id)) {
      throw new Error("Invalid school_template_id");
    }

    const allowedColumns = ["name", "url", "fields"];
    const columns = Object.keys(data).filter(col =>
      allowedColumns.includes(col)
    );

    if (columns.length === 0) {
      throw new Error("No valid fields to update");
    }

    const setClause = columns
      .map((col, i) => `${col} = $${i + 1}`)
      .join(", ");

    const values = columns.map(col => data[col]);

    const query = `
      UPDATE school_template
      SET ${setClause},
          updated_at = NOW()
      WHERE school_template_id = $${columns.length + 1}
      RETURNING *;
    `;

    const result = await pool.query(query, [
      ...values,
      school_template_id
    ]);

    return result.rows[0];
  },

  /**
   * Delete Template
   */
  async deleteTemplate(school_template_id) {
    if (!Number.isInteger(school_template_id)) {
      throw new Error("Invalid school_template_id");
    }

    const query = `
      DELETE FROM school_template
      WHERE school_template_id = $1
      RETURNING *;
    `;

    const result = await pool.query(query, [school_template_id]);
    return result.rows[0];
  }
};
