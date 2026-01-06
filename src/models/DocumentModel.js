import pool from "../config/db/db_config.js"; // PostgreSQL connection pool

export const DocumentModel = {

  // --------------------------------------------------
  // CREATE DOCUMENT
  // --------------------------------------------------
  async createDocument({ school_id, document_type, files }) {
    const query = `
      INSERT INTO document (
        school_id,
        document_type,
        files
      )
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    const values = [school_id, document_type, files];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  // --------------------------------------------------
  // GET DOCUMENT BY ID
  // --------------------------------------------------
  async getDocumentById(document_id) {
    const query = `SELECT * FROM document WHERE document_id = $1;`;
    const { rows } = await pool.query(query, [document_id]);
    return rows[0];
  },

  // --------------------------------------------------
  // GET DOCUMENTS BY SCHOOL ID
  // --------------------------------------------------
  async getBySchoolId(school_id) {
    const query = `
      SELECT * FROM document 
      WHERE school_id = $1 
      ORDER BY updated_at DESC;
    `;
    const { rows } = await pool.query(query, [school_id]);
    return rows;
  },

  // --------------------------------------------------
  // GET DOCUMENT BY TYPE + SCHOOL
  // (useful if each type has unique entry)
  // --------------------------------------------------
  async getByType(school_id, document_type) {
    const query = `
      SELECT * FROM document 
      WHERE school_id = $1 AND document_type = $2;
    `;
    const { rows } = await pool.query(query, [school_id, document_type]);
    return rows[0];
  },
  async getByStudentId(school_id, student_id) {
    const query = `
      SELECT * FROM document 
      WHERE school_id = $1 AND student_id = $2;
    `;
    const { rows } = await pool.query(query, [school_id, student_id]);
    return rows;
  },
  async getByTeacherId(school_id, teacher_id) {
    const query = `
      SELECT * FROM document 
      WHERE school_id = $1 AND teacher_id = $2;
    `;
    const { rows } = await pool.query(query, [school_id, teacher_id]);
    return rows;
  },
  // --------------------------------------------------
  // UPDATE DOCUMENT (DYNAMIC FIELDS)
  // --------------------------------------------------
  // --------------------------------------------------
  // UPDATE DOCUMENT (IF NOT EXISTS → CREATE IT)
  // --------------------------------------------------
  async updateDocument(document_id, fields) {
    const keys = Object.keys(fields);

    if (keys.length === 0) {
      throw new Error("No fields provided for update");
    }

    // First check if document exists
    const existing = await this.getDocumentById(document_id);

    // If NOT EXISTS → create a new one
    if (!existing) {
      // school_id and document_type are required to create a new row
      if (!fields.school_id || !fields.document_type) {
        throw new Error(
          "Document not found. To create new document, provide school_id and document_type."
        );
      }

      const newDoc = await this.createDocument({
        school_id: fields.school_id,
        document_type: fields.document_type,
        files: fields.files || null,
      });

      return newDoc;
    }

    // If EXISTS → update dynamically
    const setClause = keys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    const query = `
      UPDATE document
      SET ${setClause},
          updated_at = NOW()
      WHERE document_id = $${keys.length + 1}
      RETURNING *;
    `;

    const values = [...Object.values(fields), document_id];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
  ,

  // --------------------------------------------------
  // DELETE DOCUMENT
  // --------------------------------------------------
  async deleteDocument(document_id) {
    const query = `
      DELETE FROM document 
      WHERE document_id = $1 
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [document_id]);
    return rows[0];
  },

  // --------------------------------------------------
  // UPDATE FILES (ADD / REMOVE / REPLACE FILE LIST)
  // --------------------------------------------------
  async updateFiles(document_id, files) {
    const query = `
      UPDATE document
      SET files = $1,
          updated_at = NOW()
      WHERE document_id = $2
      RETURNING *;
    `;

    const values = [files, document_id];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },
  // --------------------------------------------------
  // UPDATE DOCUMENT LIST (ADD FILE TO JSON ARRAY)
  // --------------------------------------------------
  async updateDocumentList(school_id, document_type, file_title, file_url, file_size) {
    // 1. Check if document exists
    const queryCheck = `
    SELECT * FROM document 
    WHERE school_id = $1 AND document_type = $2;
  `;
    const { rows } = await pool.query(queryCheck, [school_id, document_type]);
    const existing = rows[0];

    // Prepare new file object
    const newFile = {
      title: file_title,
      url: file_url,
      size: file_size,
      uploaded_at: new Date()
    };

    // --------------------------------------------------
    // CASE 1: DOCUMENT DOES NOT EXIST → CREATE NEW ROW
    // --------------------------------------------------
    if (!existing) {
      const filesArray = [newFile]; // create fresh list

      const createQuery = `
      INSERT INTO document (
        school_id,
        document_type,
        files
      )
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

      const { rows } = await pool.query(createQuery, [
        school_id,
        document_type,
        JSON.stringify(filesArray),
      ]);

      return rows[0];
    }

    // --------------------------------------------------
    // CASE 2: DOCUMENT EXISTS → PUSH FILE INTO JSON ARRAY
    // --------------------------------------------------
    let updatedFiles = [];

    if (existing.files && Array.isArray(existing.files)) {
      updatedFiles = [...existing.files, newFile];
    } else {
      updatedFiles = [newFile]; // If null or invalid
    }

    const updateQuery = `
    UPDATE document
    SET files = $1,
        updated_at = NOW()
    WHERE document_id = $2
    RETURNING *;
  `;

    const { rows: updateRows } = await pool.query(updateQuery, [
      JSON.stringify(updatedFiles),
      existing.document_id,
    ]);

    return updateRows[0];
  }
  ,
  async updateDocumentByIndex(
    school_id,
    document_type,
    file_title,
    file_url,
    file_size,
    fileIndex
  ) {

    // 1. Fetch existing document
    const queryCheck = `
    SELECT * FROM document 
    WHERE school_id = $1 AND document_type = $2;
  `;
    const { rows } = await pool.query(queryCheck, [school_id, document_type]);
    const existing = rows[0];

    // New file object (to replace)
    const updatedFile = {
      title: file_title,
      url: file_url,
      size: file_size,
      uploaded_at: new Date()
    };

    // --------------------------------------------------
    // CASE 1: DOCUMENT DOES NOT EXIST → CREATE NEW
    // No "old url" exists, return null
    // --------------------------------------------------
    if (!existing) {
      const fileArray = [];
      fileArray[fileIndex] = updatedFile;

      const createQuery = `
      INSERT INTO document (school_id, document_type, files)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

      await pool.query(createQuery, [
        school_id,
        document_type,
        JSON.stringify(fileArray),
      ]);

      return null; // no old URL
    }

    // --------------------------------------------------
    // CASE 2: UPDATE INDEX AND RETURN OLD URL
    // --------------------------------------------------
    let currentFiles = existing.files && Array.isArray(existing.files)
      ? [...existing.files]
      : [];

    // Store old URL BEFORE updating
    const oldUrl = currentFiles[fileIndex]?.url || null;

    // Update the index
    currentFiles[fileIndex] = updatedFile;

    const updateQuery = `
    UPDATE document
    SET files = $1,
        updated_at = NOW()
    WHERE document_id = $2
    RETURNING *;
  `;

    await pool.query(updateQuery, [
      JSON.stringify(currentFiles),
      existing.document_id,
    ]);

    // Return OLD url
    return oldUrl;
  },
  // --------------------------------------------------
  // DELETE FILE BY INDEX (RETURN OLD URL)
  // --------------------------------------------------
  async deleteDocumentByIndex(school_id, document_type, fileIndex) {

    // 1. Fetch document
    const queryCheck = `
    SELECT * FROM document 
    WHERE school_id = $1 AND document_type = $2;
  `;
    const { rows } = await pool.query(queryCheck, [school_id, document_type]);
    const existing = rows[0];

    // If document not found → nothing to delete
    if (!existing) return null;

    let currentFiles = existing.files && Array.isArray(existing.files)
      ? [...existing.files]
      : [];

    // If index is invalid OR empty → return null
    const oldUrl = currentFiles[fileIndex]?.url || null;
    const sizeOldFile = currentFiles[fileIndex]?.size || null;

    if (oldUrl === null) return null;

    // Remove index
    currentFiles.splice(fileIndex, 1);

    // Update DB
    const updateQuery = `
    UPDATE document
    SET files = $1,
        updated_at = NOW()
    WHERE document_id = $2
    RETURNING *;
  `;

    await pool.query(updateQuery, [
      JSON.stringify(currentFiles),
      existing.document_id,
    ]);

    // Return the deleted file’s old URL
    return { lastDocumentUrl: oldUrl, sizeOldFile };
  }, async updateStudentDocumentList(school_id, document_type, file_title, file_url, file_size, year, student_id) {
    // 1. Check if document exists
    const queryCheck = `
    SELECT * FROM document 
    WHERE school_id = $1 AND document_type = $2 AND student_id = $3;
  `;
    const { rows } = await pool.query(queryCheck, [school_id, document_type, student_id]);
    const existing = rows[0];

    // Prepare new file object
    const newFile = {
      title: file_title,
      url: file_url,
      size: file_size,
      year,
      uploaded_at: new Date()
    };

    // --------------------------------------------------
    // CASE 1: DOCUMENT DOES NOT EXIST → CREATE NEW ROW
    // --------------------------------------------------
    if (!existing) {
      const filesArray = [newFile]; // create fresh list

      const createQuery = `
      INSERT INTO document (
        school_id,
        student_id,
        document_type,
        files
      )
      VALUES ($1, $2, $3,$4)
      RETURNING *;
    `;

      const { rows } = await pool.query(createQuery, [
        school_id,
        student_id,
        document_type,
        JSON.stringify(filesArray),
      ]);

      return rows[0];
    }

    // --------------------------------------------------
    // CASE 2: DOCUMENT EXISTS → PUSH FILE INTO JSON ARRAY
    // --------------------------------------------------
    let updatedFiles = [];

    if (existing.files && Array.isArray(existing.files)) {
      updatedFiles = [...existing.files, newFile];
    } else {
      updatedFiles = [newFile]; // If null or invalid
    }

    const updateQuery = `
    UPDATE document
    SET files = $1,
        updated_at = NOW()
    WHERE document_id = $2
    RETURNING *;
  `;

    const { rows: updateRows } = await pool.query(updateQuery, [
      JSON.stringify(updatedFiles),
      existing.document_id,
    ]);

    return updateRows[0];
  }
  ,
  async updateStudentDocumentByIndex(
  school_id,
  student_id,
  document_type,
  file_title,
  file_url,     // optional → update only when provided
  file_size,
  fileIndex,
  year
) {

  // 1. Fetch existing document
  const queryCheck = `
      SELECT * FROM document 
      WHERE school_id = $1 AND document_type = $2 AND student_id = $3
  `;

  const { rows } = await pool.query(queryCheck, [
    school_id,
    document_type,
    student_id
  ]);

  const existing = rows[0];

  // New file base structure
  const newFileData = {
    title: file_title,
    year,
    uploaded_at: new Date()
  };

  // --------------------------------------------------
  // CASE 1: DOCUMENT DOES NOT EXIST → CREATE NEW
  // --------------------------------------------------
  if (!existing) {
    const fileArray = [];

    newFileData.url = file_url || null;
    newFileData.size = file_size || null;

    fileArray[fileIndex] = newFileData;

    const createQuery = `
      INSERT INTO document (school_id, student_id, document_type, files)
      VALUES ($1, $2, $3, $4)
    `;

    await pool.query(createQuery, [
      school_id,
      student_id,
      document_type,
      JSON.stringify(fileArray)
    ]);

    return null; // no old url
  }

  // --------------------------------------------------
  // CASE 2: DOCUMENT EXISTS → UPDATE INDEX
  // --------------------------------------------------
  const files = existing.files || [];

  const oldFile = files[fileIndex] || {};

  const oldUrl = oldFile.url || null;
  const oldSize = oldFile.size || null;

  // Update logic
  newFileData.url  = file_url ? file_url : oldUrl;
  newFileData.size = file_size ? file_size : oldSize;

  // Replace file at index
  files[fileIndex] = newFileData;

  const updateQuery = `
    UPDATE document 
    SET files = $1, updated_at = NOW()
    WHERE document_id = $2
  `;

  await pool.query(updateQuery, [
    JSON.stringify(files),
    existing.document_id
  ]);

  // Return old URL only when replaced
  return file_url ? oldUrl : null;
}
, async deleteStudentDocumentByIndex(school_id, student_id, document_type, fileIndex) {

    // 1. Fetch document
    const queryCheck = `
    SELECT * FROM document 
    WHERE school_id = $1 AND document_type = $2 AND student_id = $3;
  `;
    const { rows } = await pool.query(queryCheck, [school_id, document_type, student_id]);
    const existing = rows[0];

    // If document not found → nothing to delete
    if (!existing) return null;

    let currentFiles = existing.files && Array.isArray(existing.files)
      ? [...existing.files]
      : [];

    // If index is invalid OR empty → return null
    const oldUrl = currentFiles[fileIndex]?.url || null;
    const sizeOldFile = currentFiles[fileIndex]?.size || null;

    if (oldUrl === null) return null;

    // Remove index
    currentFiles.splice(fileIndex, 1);

    // Update DB
    const updateQuery = `
    UPDATE document
    SET files = $1,
        updated_at = NOW()
    WHERE document_id = $2
    RETURNING *;
  `;

    await pool.query(updateQuery, [
      JSON.stringify(currentFiles),
      existing.document_id,
    ]);

    // Return the deleted file’s old URL
    return { lastDocumentUrl: oldUrl, sizeOldFile };
  },
  async updateTeacherDocumentList(school_id, document_type, file_title, file_url, file_size, year, teacher_id) {
    // 1. Check if document exists
    const queryCheck = `
    SELECT * FROM document 
    WHERE school_id = $1 AND document_type = $2 AND teacher_id = $3;
  `;
    const { rows } = await pool.query(queryCheck, [school_id, document_type, teacher_id]);
    const existing = rows[0];

    // Prepare new file object
    const newFile = {
      title: file_title,
      url: file_url,
      size: file_size,
      year,
      uploaded_at: new Date()
    };

    // --------------------------------------------------
    // CASE 1: DOCUMENT DOES NOT EXIST → CREATE NEW ROW
    // --------------------------------------------------
    if (!existing) {
      const filesArray = [newFile]; // create fresh list

      const createQuery = `
      INSERT INTO document (
        school_id,
        teacher_id,
        document_type,
        files
      )
      VALUES ($1, $2, $3,$4)
      RETURNING *;
    `;

      const { rows } = await pool.query(createQuery, [
        school_id,
        teacher_id,
        document_type,
        JSON.stringify(filesArray),
      ]);

      return rows[0];
    }

    // --------------------------------------------------
    // CASE 2: DOCUMENT EXISTS → PUSH FILE INTO JSON ARRAY
    // --------------------------------------------------
    let updatedFiles = [];

    if (existing.files && Array.isArray(existing.files)) {
      updatedFiles = [...existing.files, newFile];
    } else {
      updatedFiles = [newFile]; // If null or invalid
    }

    const updateQuery = `
    UPDATE document
    SET files = $1,
        updated_at = NOW()
    WHERE document_id = $2
    RETURNING *;
  `;

    const { rows: updateRows } = await pool.query(updateQuery, [
      JSON.stringify(updatedFiles),
      existing.document_id,
    ]);

    return updateRows[0];
  },
  async updateTeacherDocumentByIndex(
    school_id,
    teacher_id,
    document_type,
    file_title,
    file_url,     // optional → update only when present
    file_size,
    fileIndex,
    year
  ) {
    // 1. Fetch existing document
    const queryCheck = `
    SELECT * FROM document 
    WHERE school_id = $1 AND document_type = $2 AND teacher_id = $3
  `;

    const { rows } = await pool.query(queryCheck, [
      school_id,
      document_type,
      teacher_id
    ]);

    const existing = rows[0];

    // New file data (URL optional)
    const newFileData = {
      title: file_title,
      year,
      uploaded_at: new Date()
    };
    // --------------------------------------------------
    // CASE 1: DOCUMENT DOES NOT EXIST → CREATE NEW
    // --------------------------------------------------
    if (!existing) {
      const fileArray = [];

      // If file_url exists → set URL, else NULL
      newFileData.url = file_url || null;

      fileArray[fileIndex] = newFileData;

      const createQuery = `
      INSERT INTO document (school_id, teacher_id, document_type, files)
      VALUES ($1, $2, $3, $4)
    `;

      await pool.query(createQuery, [
        school_id,
        teacher_id,
        document_type,
        JSON.stringify(fileArray)
      ]);

      return null;
    }

    // --------------------------------------------------
    // CASE 2: DOCUMENT EXISTS → UPDATE INDEX
    // --------------------------------------------------
    const files = existing.files || [];

    // If file exists at index, get old file data
    const oldFile = files[fileIndex] || {};

    const oldUrl = oldFile.url || null;
    const oldsize= oldFile.size || null;

    // ----------------------
    // UPDATE RULE:
    // ----------------------
    // If file_url exists → replace URL
    // If file_url is NOT provided → keep old URL
    // ----------------------
    newFileData.url = file_url ? file_url : oldUrl;
    newFileData.size = file_size ? file_size : oldsize;

    // Replace file at index
    files[fileIndex] = newFileData;
    
    const updateQuery = `
    UPDATE document 
    SET files = $1
    WHERE document_id = $2
  `;

    await pool.query(updateQuery, [
      JSON.stringify(files),
      existing.document_id
    ]);

    // Return old URL only when a new URL is uploaded
    return file_url ? oldUrl : null;
  }, async deleteTeacherDocumentByIndex(school_id, teacher_id, document_type, fileIndex) {


    // 1. Fetch document
    const queryCheck = `
    SELECT * FROM document 
    WHERE school_id = $1 AND document_type = $2 AND teacher_id = $3;
  `;
    const { rows } = await pool.query(queryCheck, [school_id, document_type, teacher_id]);
    const existing = rows[0];

    // If document not found → nothing to delete
    if (!existing) return null;

    let currentFiles = existing.files && Array.isArray(existing.files)
      ? [...existing.files]
      : [];

    // If index is invalid OR empty → return null
    const oldUrl = currentFiles[fileIndex]?.url || null;
    const sizeOldFile = currentFiles[fileIndex]?.size || null;

    if (oldUrl === null) return null;

    // Remove index
    currentFiles.splice(fileIndex, 1);

    // Update DB
    const updateQuery = `
    UPDATE document
    SET files = $1,
        updated_at = NOW()
    WHERE document_id = $2
    RETURNING *;
  `;

    await pool.query(updateQuery, [
      JSON.stringify(currentFiles),
      existing.document_id,
    ]);

    // Return the deleted file’s old URL
    return { lastDocumentUrl: oldUrl, sizeOldFile };
  }

};
