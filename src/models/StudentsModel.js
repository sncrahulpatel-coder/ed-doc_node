import pool from "../config/db/db_config.js"; // PostgreSQL connection pool

export const StudentsModel = {
  
  // --------------------------------------------------
  // CREATE STUDENT
  // --------------------------------------------------
  async createStudent({
    school_id,
    student_name,
    enrollment_no,
    roll_no,
    division,
    standard,
    gender,
    dob,
    father_name,
    mother_name,
    mobile,
    address,
  }) {
    const query = `
      INSERT INTO students (
      school_id,
        student_name,
        enrollment_no,
        roll_no,
        division,
        standard,
        gender,
        dob,
        father_name,
        mother_name,
        mobile,
        address
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *;
    `;

    const values = [
      school_id,
      student_name,
      enrollment_no,
      roll_no,
      division,
      standard,
      gender,
      dob,
      father_name,
      mother_name,
      mobile,
      address,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  // --------------------------------------------------
  // GET BY ID
  // --------------------------------------------------
  async getStudentById(student_id) {
    const query = `SELECT * FROM students WHERE student_id = $1;`;
    const { rows } = await pool.query(query, [student_id]);
    return rows[0];
  },
   async getBySchoolId(school_id) {
    const query = `SELECT * FROM students WHERE school_id = $1 ORDER BY updated_at DESC;`;
    const { rows } = await pool.query(query, [school_id]);
    return rows;
  },
async getStudentByEnrolId(enrollment_no) {
    const query = `SELECT * FROM students WHERE enrollment_no = $1;`;
    const { rows } = await pool.query(query, [enrollment_no]);
    return rows[0];
  },
  async getStudentByEnrolIdforUpdate(enrollment_no,student_id) {
    const query = `SELECT * FROM students WHERE enrollment_no = $1 and student_id != $2;`;
    const { rows } = await pool.query(query, [enrollment_no,student_id]);
    return rows[0];
  },
  // --------------------------------------------------
  // GET BY ENROLLMENT NUMBER
  // --------------------------------------------------
  async getStudentByEnrollment(enrollment_no) {
    const query = `SELECT * FROM students WHERE enrollment_no = $1;`;
    const { rows } = await pool.query(query, [enrollment_no]);
    return rows[0];
  },

  // --------------------------------------------------
  // GET ALL STUDENTS
  // --------------------------------------------------
  async getAllStudents() {
    const query = `SELECT * FROM students ORDER BY student_id;`;
    const { rows } = await pool.query(query);
    return rows;
  },

  // --------------------------------------------------
  // UPDATE STUDENT (DYNAMIC)
  // --------------------------------------------------
  async updateStudent(student_id, fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0) {
      throw new Error("No fields provided for update");
    }

    // Build SET clause like: "name=$1, address=$2"
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(", ");

    const query = `
      UPDATE students
      SET ${setClause},
          updated_at = NOW()
      WHERE student_id = $${keys.length + 1}
      RETURNING *;
    `;

    const values = [...Object.values(fields), student_id];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  // --------------------------------------------------
  // DELETE STUDENT
  // --------------------------------------------------
  async deleteStudent(student_id) {
    const query = `DELETE FROM students WHERE student_id = $1 RETURNING *;`;
    const { rows } = await pool.query(query, [student_id]);
    return rows[0];
  },

  // --------------------------------------------------
  // UPDATE PROFILE PIC / LOGO / EXTRA FIELD LATER
  // --------------------------------------------------
  async updateStudentProfile(student_id, { profile }) {
    const query = `
      UPDATE students
      SET profile = $1,
          updated_at = NOW()
      WHERE student_id = $2
      RETURNING *;
    `;

    const values = [profile, student_id];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },
};
