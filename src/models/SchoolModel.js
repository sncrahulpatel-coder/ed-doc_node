import pool from "../config/db/db_config.js"; // PostgreSQL connection pool

export const SchoolModel = {
  
  // Create new school record
  async createSchool({
  school_name,
  address,
  number,
  email,
  password,
  year_of_establishment,
  total_standard,
  total_students,
  total_teachers,
  total_subjects,
}) {
  const query = `
    INSERT INTO school (
      school_name,
      address,
      number,
      email,
      password,
      year_of_establishment,
      total_standard,
      total_students,
      total_teachers,
      total_subjects
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;
  `;

  const values = [
    school_name,
    address,
    number,
    email,
    password,
    year_of_establishment,
    total_standard,
    total_students,
    total_teachers,
    total_subjects,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}
,

  // Get school by ID
  async getSchoolById(school_id) {
    const query = `SELECT * FROM school WHERE school_id = $1;`;
    const { rows } = await pool.query(query, [school_id]);
    return rows[0];
  },

  // Get school by email
  async getSchoolByEmail(email) {
    const query = `SELECT * FROM school WHERE email = $1;`;
    const { rows } = await pool.query(query, [email]);
    return rows[0];
  },

  // Get all schools
  async getAllSchools() {
    const query = `SELECT * FROM school ORDER BY school_id;`;
    const { rows } = await pool.query(query);
    return rows;
  },

  // Update school by ID
 async updateSchool(school_id, fields) {
  // `fields` is an object, e.g. { email: "abc@test.com", number: "9999999999" }

  // Get keys and values dynamically
  const keys = Object.keys(fields);
  if (keys.length === 0) {
    throw new Error("No fields provided for update");
  }

  // Build SET clause dynamically: "column1 = $1, column2 = $2, ..."
  const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(", ");

  // Add updated_at automatically
  const query = `
    UPDATE school
    SET ${setClause}, updated_at = NOW()
    WHERE school_id = $${keys.length + 1}
    RETURNING *;
  `;

  const values = [...Object.values(fields), school_id];
  const { rows } = await pool.query(query, values);
  return rows[0];
}
,
  // Delete school by ID
  async deleteSchool(school_id) {
    const query = `DELETE FROM school WHERE school_id = $1 RETURNING *;`;
    const { rows } = await pool.query(query, [school_id]);
    return rows[0];
  },
   async updateSchoolLogo(school_id, { logo }) {
    const query = `
      UPDATE school
      SET logo = $1,
          updated_at = NOW()
      WHERE school_id = $2
      RETURNING *;
    `;
    const values = [logo, school_id];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },
};
