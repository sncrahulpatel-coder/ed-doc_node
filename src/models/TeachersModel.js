import pool from "../config/db/db_config.js"; // PostgreSQL connection pool

export const TeachersModel = {

  // --------------------------------------------------
  // CREATE TEACHER
  // --------------------------------------------------
  async createTeacher(school_id,{ teacher_School_id, teacher_name, mobile }) {
    const query = `
      INSERT INTO teacher (
        school_id,
        teacher_School_id,
        teacher_name,
        mobile
      )
      VALUES ($1, $2, $3,$4)
      RETURNING *;
    `;
 
    const values = [
      school_id,
      teacher_School_id,
      teacher_name,
      mobile
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  // --------------------------------------------------
  // GET BY ID
  // --------------------------------------------------
  async getTeacherById(teacher_id) {
    const query = `SELECT * FROM teacher WHERE teacher_id = $1;`;
    const { rows } = await pool.query(query, [teacher_id]);
    return rows[0];
  },
  async getTeacherBySchoolIdTeacherId(school_id,teacher_school_id) {
    const query = `SELECT * FROM teacher WHERE school_id = $1 and teacher_school_id = $2 ;`;
    const { rows } = await pool.query(query, [school_id,teacher_school_id]);
    return rows[0];
  },
   async getTeacherBySchoolIdTeacherIdUpdate(school_id,teacher_school_id,teacher_id) {
    const query = `SELECT * FROM teacher WHERE school_id = $1 and teacher_school_id = $2 and teacher_id != $3;`;
    const { rows } = await pool.query(query, [school_id,teacher_school_id,teacher_id]);
    return rows[0];
  },
  // --------------------------------------------------
  // GET BY SCHOOL ID
  // --------------------------------------------------
  async getBySchoolId(teacher_School_id) {
    const query = `SELECT * FROM teacher WHERE teacher_School_id = $1;`;
    const { rows } = await pool.query(query, [teacher_School_id]);
    return rows;
  },

  // --------------------------------------------------
  // GET ALL TEACHERS
  // --------------------------------------------------
  async getAllTeachers(school_id) {
    const query = `SELECT * FROM teacher where school_id = $1 ORDER BY teacher_id;`;
    const { rows } = await pool.query(query,[school_id]);
    return rows;
  },

  // --------------------------------------------------
  // UPDATE TEACHER (DYNAMIC)
  // --------------------------------------------------
  async updateTeacher(teacher_id, fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0) {
      throw new Error("No fields provided for update");
    }

    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");

    const query = `
      UPDATE teacher
      SET ${setClause},
          updated_at = NOW()
      WHERE teacher_id = $${keys.length + 1}
      RETURNING *;
    `;

    const values = [...Object.values(fields), teacher_id];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  // --------------------------------------------------
  // DELETE TEACHER
  // --------------------------------------------------
  async deleteTeacher(teacher_id) {
    const query = `DELETE FROM teacher WHERE teacher_id = $1 RETURNING *;`;
    const { rows } = await pool.query(query, [teacher_id]);
    return rows[0];
  },

};
