import apiResponse from "../utils/apiResponse.js";
import { SchoolModel } from "../models/schoolModel.js";
import { deleteDoc_aws, downloadMultipleFromS3, getCachedViewUrl, getDownloadUrl_aws, getFolderSize_aws, getUploadUrl_aws, getViewUrl_aws_download } from "../aws/aws3.js";
import { PlansModel } from "../models/PlansModel.js";
import { StudentsModel } from "../models/StudentsModel.js";
import fs from "fs";
import xlsx from "xlsx";
import { TeachersModel } from "../models/TeachersModel.js";
import { DocumentModel } from "../models/DocumentModel.js";
import { SchoolTemplateModel } from "../models/schoolTemplateModel.js";
import { UploadDocumentModel } from "../models/UploadDocumentModel.js";
import { extractFormFields_aws } from "../ChatGPT/chatGPT.js";
import fillTemplate from "./ScenCopyGenerater.js";

export const dashboardData = async (req, res, next) => {
  try {

    const data = await SchoolModel.getSchoolById(req.user.id);

    const logoAws = await getCachedViewUrl(data.logo);
    data.logo = logoAws;
    return res.json(apiResponse(true, "School Data", data, req.rrn));

  } catch (err) {
    next(err);
  }
};
export const addStudent = async (req, res, next) => {
  try {
    const {
      enrollmentNo,
      Standard,
      division,
      rollNo,
      studentName,
      gender,
      dob,
      fatherName,
      motherName,
      mobile,
      address,
      fileName,
      extension,
      fileSize,
      fileType
    } = req.body;

    // -------------------------------
    // 1️⃣ REQUIRED FIELD VALIDATIONS
    // -------------------------------
    const requiredFields = {
      enrollmentNo,
      Standard,
      division,
      rollNo,
      studentName,
      gender,
      dob,
      fatherName,
      mobile,
      address
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value || value === "") {
        return res
          .status(400)
          .json(apiResponse(false, `${key} is required`, [], req.rrn));
      }
    }

    // -------------------------------
    // 2️⃣ FORMAT & TYPE VALIDATIONS
    // -------------------------------

    // Enrollment number check - numeric or alphanumeric
    if (!/^[A-Za-z0-9\-]+$/.test(enrollmentNo)) {
      return res
        .status(400)
        .json(apiResponse(false, "Invalid enrollment number format", [], req.rrn));
    }

    // Roll number numeric
    if (isNaN(rollNo)) {
      return res
        .status(400)
        .json(apiResponse(false, "Roll number must be a number", [], req.rrn));
    }

    // Gender check
    const allowedGenders = ["male", "female", "other"];
    if (!allowedGenders.includes(gender.toLowerCase())) {
      return res
        .status(400)
        .json(apiResponse(false, "Gender must be Male, Female or Other", [], req.rrn));
    }

    // Mobile check
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return res
        .status(400)
        .json(apiResponse(false, "Invalid mobile number", [], req.rrn));
    }

    // DOB format validation (YYYY-MM-DD)
    // if (isNaN(new Date(dob).getTime())) {
    //   return res
    //     .status(400)
    //     .json(apiResponse(false, "Invalid date of birth format", [], req.rrn));
    // }

    // Check age > 3 years (optional but recommended)
    const age = new Date().getFullYear() - new Date(dob).getFullYear();
    if (age < 1) {
      return res
        .status(400)
        .json(apiResponse(false, "Student age must be greater than 1 years", [], req.rrn));
    }

    // -------------------------------
    // 3️⃣ CHECK IF ENROLLMENT ALREADY EXISTS
    // -------------------------------
    const check = await StudentsModel.getStudentByEnrolId(enrollmentNo);

    if (check) {
      return res
        .status(409) // 409 = conflict (better than 404)
        .json(apiResponse(false, "Admission No / Enrollment No Already Exist", [], req.rrn));
    }

    // -------------------------------
    // 4️⃣ SAVE TO DATABASE
    // -------------------------------

    if (fileName) {
      const { uploadUrl, key } = await getUploadUrl_aws({ fileName, fileType, folder_name: 'school_' + req.user.id + "/" + enrollmentNo, UniqueFileName: 'profile' });

      const sizeMB = fileSize / (1024 * 1024); // Convert to MB
      if (sizeMB > 1) {
        throw new Error("50 MB Max")
      }

      await StudentsModel.createStudent({
        school_id: req.user.id,
        student_name: studentName,
        enrollment_no: enrollmentNo,
        roll_no: rollNo,
        division,
        standard: Standard,
        gender,
        dob,
        father_name: fatherName,
        mother_name: motherName || "",
        mobile,
        address,
        profile: key
      });
      return res.json(apiResponse(true, "Student Added Successfully", { uploadUrl }, req.rrn));

    } else {

      await StudentsModel.createStudent({
        school_id: req.user.id,
        student_name: studentName,
        enrollment_no: enrollmentNo,
        roll_no: rollNo,
        division,
        standard: Standard,
        gender,
        dob,
        father_name: fatherName,
        mother_name: motherName || "",
        mobile,
        address
      });
      return res.json(apiResponse(true, "Student Added Successfully", {}, req.rrn));

    }

    // -------------------------------
    // 5️⃣ SUCCESS RESPONSE
    // -------------------------------

  } catch (err) {
    next(err);
  }
};


export const addStudentBulk = async (req, res, next) => {
  let filePath = null;

  try {
    // No file uploaded?
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { path: uploadedPath } = req.file;
    filePath = uploadedPath;

    // Read Excel
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "" });

    if (data.length < 2) {
      return res
        .status(400)
        .json(apiResponse(false, "Excel file is empty", [], req.rrn));
    }

    const errors = [];
    const students = [];

    // Skip first row (header)
    for (const [idx, row] of data.slice(1).entries()) {
      const rowNum = idx + 2;

      const enrollmentNo = row[0]?.toString().trim();
      const Standard = row[1];
      const division = row[2];
      const rollNo = row[3];
      const studentName = row[4]?.toString().trim();
      const gender = row[5]?.toString().trim().toLowerCase();
      const dob = row[6];
      const fatherName = row[7]?.toString().trim();
      const motherName = row[8]?.toString().trim();
      const mobile = row[9]?.toString().trim();
      const address = row[10];

      const rowErrors = [];

      // -----------------------
      // 1️⃣ REQUIRED VALIDATION
      // -----------------------
      if (!enrollmentNo) rowErrors.push("Enrollment No is required");
      if (!Standard) rowErrors.push("Standard is required");
      if (!division) rowErrors.push("Division is required");
      if (!rollNo) rowErrors.push("Roll No is required");
      if (!studentName) rowErrors.push("Student Name is required");
      if (!gender) rowErrors.push("Gender is required");
      if (!dob) rowErrors.push("DOB is required");
      if (!mobile) rowErrors.push("Mobile No is required");

      // -----------------------
      // 2️⃣ FORMAT & DATA VALIDATION
      // -----------------------
      if (mobile && !/^[6-9]\d{9}$/.test(mobile)) {
        rowErrors.push("Mobile must be a valid 10-digit Indian number");
      }


      if (rollNo && isNaN(rollNo)) {
        rowErrors.push("Roll No must be a number");
      }

      const allowedGenders = ["male", "female", "other"];
      if (gender && !allowedGenders.includes(gender)) {
        rowErrors.push("Gender must be Male, Female or Other");
      }

      // Date validation
      // Accepts only 4-digit year, 2-digit month, 2-digit day
      const dobRegex = /^\d{4}-\d{2}-\d{2}$/;

      if (dob) {
        if (!dobRegex.test(dob)) {
          rowErrors.push("DOB must be in yyyy-mm-dd format");
        } else {
          const date = new Date(dob);
          const [year, month, day] = dob.split("-").map(Number);

          // Validate that parsed date matches input (e.g., invalid dates like 2024-13-40)
          if (
            date.getFullYear() !== year ||
            date.getMonth() + 1 !== month ||
            date.getDate() !== day
          ) {
            rowErrors.push("DOB is not a valid date");
          }
        }
      }


      // -----------------------
      // 3️⃣ CHECK IF ENROLLMENT ALREADY EXISTS
      // -----------------------
      const exists = await StudentsModel.getStudentByEnrolId(enrollmentNo);
      if (exists) {
        // ✔ Skip silently, do not show error
        rowErrors.push("Admission No / Enrollment No Already Exist");
      }

      // -----------------------
      // 4️⃣ IF ANY ERRORS → PUSH INTO ERRORS ARRAY
      // -----------------------
      if (rowErrors.length > 0) {
        errors.push({
          row: rowNum,
          errors: rowErrors,
        });
        continue;
      }

      // -----------------------
      // 5️⃣ IF VALID → PUSH INTO STUDENTS ARRAY
      // -----------------------
      students.push({
        enrollmentNo,
        Standard,
        division,
        rollNo,
        studentName,
        gender,
        dob,
        fatherName,
        motherName,
        mobile,
        address,
      });
    }

    // If any validation errors → return them
    if (errors.length > 0) {
      return res
        .status(400)
        .json(apiResponse(false, "Validation errors", { errors }, req.rrn));
    }

    // Insert each student
    for (const student of students) {
      const {
        enrollmentNo,
        Standard,
        division,
        rollNo,
        studentName,
        gender,
        dob,
        fatherName,
        motherName,
        mobile,
        address,
      } = student;

      // ❗Check Duplicate Enrollment No
      const exists = await StudentsModel.getStudentByEnrolId(enrollmentNo);
      if (exists) {
        continue; // Skip, do not throw error
      }

      await StudentsModel.createStudent({
        school_id: req.user.id,
        student_name: studentName,
        enrollment_no: enrollmentNo,
        roll_no: rollNo,
        division,
        standard: Standard,
        gender,
        dob,
        father_name: fatherName,
        mother_name: motherName || "",
        mobile,
        address
      });
    }

    return res.json(apiResponse(true, "Students added successfully", [], req.rrn));

  } catch (err) {
    next(err);
  } finally {
    // Delete uploaded file
    if (filePath) {
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting uploaded file:", err);
      });
    }
  }
};

export const getStudentList = async (req, res, next) => {
  try {

    const data = await StudentsModel.getBySchoolId(req.user.id);


    const updatedData = await Promise.all(
      data.map(async (item) => {
        if (item.profile) {
          item.profile = await getCachedViewUrl(item.profile);
        }
        return item;
      })
    );
    return res.json(apiResponse(true, "School Data", updatedData, req.rrn));

  } catch (err) {
    next(err);
  }
};



export const schoolAddTeacher = async (req, res, next) => {

  try {

    const {
      teacherId,
      teacherName,
      contactNo
    } = req.body;

    if (!teacherId) throw new Error("Teacher Id is missing")
    if (!teacherName) throw new Error("Teacher Name is missing")
    if (!contactNo) throw new Error("Contact is missing")

    const existingId = await TeachersModel.getTeacherBySchoolIdTeacherId(req.user.id, teacherId);
    if (existingId) {
      return res
        .status(400)
        .json(apiResponse(false, "Teacher ID Alredy Exist", {}, req.rrn));
    }

    await TeachersModel.createTeacher(req.user.id, { teacher_School_id: teacherId, teacher_name: teacherName, mobile: contactNo })

    return res.json(apiResponse(true, "Teacher Added Success", {}, req.rrn));

  } catch (err) {
    next(err); // forward error to middleware
  }
};


export const getTeacherList = async (req, res, next) => {

  try {

    const data = await TeachersModel.getAllTeachers(req.user.id);

    return res.json(apiResponse(true, "Teacher List Success", data, req.rrn));

  } catch (err) {
    next(err); // forward error to middleware
  }
};


export const studentUpdate = async (req, res, next) => {

  try {

    const {
      enrollmentNo,
      Standard,
      division,
      rollNo,
      studentName,
      gender,
      dob,
      fatherName,
      motherName,
      mobile,
      address,
      fileName,
      extension,
      fileSize,
      fileType
    } = req.body;

    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json(apiResponse(false, `Id Required`, [], req.rrn));
    }



    const requiredFields = {
      enrollmentNo,
      Standard,
      division,
      rollNo,
      studentName,
      gender,
      dob,
      fatherName,
      mobile,
      address
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value || value === "") {
        return res
          .status(400)
          .json(apiResponse(false, `${key} is required`, [], req.rrn));
      }
    }

    // -------------------------------
    // 2️⃣ FORMAT & TYPE VALIDATIONS
    // -------------------------------

    // Enrollment number check - numeric or alphanumeric
    if (!/^[A-Za-z0-9\-]+$/.test(enrollmentNo)) {
      return res
        .status(400)
        .json(apiResponse(false, "Invalid enrollment number format", [], req.rrn));
    }

    // Roll number numeric
    if (isNaN(rollNo)) {
      return res
        .status(400)
        .json(apiResponse(false, "Roll number must be a number", [], req.rrn));
    }

    // Gender check
    const allowedGenders = ["male", "female", "other"];
    if (!allowedGenders.includes(gender.toLowerCase())) {
      return res
        .status(400)
        .json(apiResponse(false, "Gender must be Male, Female or Other", [], req.rrn));
    }

    // Mobile check
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return res
        .status(400)
        .json(apiResponse(false, "Invalid mobile number", [], req.rrn));
    }

    // DOB format validation (YYYY-MM-DD)
    // if (isNaN(new Date(dob).getTime())) {
    //   return res
    //     .status(400)
    //     .json(apiResponse(false, "Invalid date of birth format", [], req.rrn));
    // }

    // Check age > 3 years (optional but recommended)
    const age = new Date().getFullYear() - new Date(dob).getFullYear();
    if (age < 1) {
      return res
        .status(400)
        .json(apiResponse(false, "Student age must be greater than 1 years", [], req.rrn));
    }
    const check = await StudentsModel.getStudentByEnrolIdforUpdate(enrollmentNo, id);

    if (check) {
      return res
        .status(409) // 409 = conflict (better than 404)
        .json(apiResponse(false, "Admission No / Enrollment No Already Exist", [], req.rrn));
    }

    const dataUpdate = {
      enrollment_no: enrollmentNo,
      standard: Standard,
      division,
      roll_no: rollNo,
      student_name: studentName,
      gender,
      dob,
      father_name: fatherName,
      mother_name: motherName,
      mobile,
      address,
    }

    if (fileName) {
      const { uploadUrl, key } = await getUploadUrl_aws({ fileName, fileType, folder_name: 'school_' + req.user.id + "/" + enrollmentNo, UniqueFileName: 'profile' });

      const sizeMB = fileSize / (1024 * 1024); // Convert to MB
      if (sizeMB > 1) {
        throw new Error("50 MB Max")
      }

      await StudentsModel.updateStudent(id, { ...dataUpdate, profile: key });
      return res.json(apiResponse(true, "Student Updated", { uploadUrl }, req.rrn));
    } else {
      await StudentsModel.updateStudent(id, dataUpdate);
      return res.json(apiResponse(true, "Student Updated", {}, req.rrn));
    }


  } catch (err) {
    next(err); // forward error to middleware
  }
};


export const UpdateTeacher = async (req, res, next) => {

  try {

    const { teacher_id, teacher_school_id, teacher_name, mobile } = req.body;

    if (!teacher_school_id) throw new Error("Teacher Id is missing")
    if (!teacher_name) throw new Error("Teacher Name is missing")
    if (!mobile) throw new Error("Contact is missing")


    // issue in Student Also 
    const existingId = await TeachersModel.getTeacherBySchoolIdTeacherIdUpdate(req.user.id, teacher_school_id, teacher_id);
    if (existingId) {
      return res
        .status(400)
        .json(apiResponse(false, "Teacher ID Alredy Exist", {}, req.rrn));
    }

    await TeachersModel.updateTeacher(teacher_id, { teacher_school_id, teacher_name, mobile })

    return res.json(apiResponse(true, "Teacher Updated", {}, req.rrn));

  } catch (err) {
    next(err); // forward error to middleware
  }
};


export const uploadDocument = async (req, res, next) => {

  try {

    const { title, type, fileType, fileSize, extension, fileName } = req.body;

    if (!title) throw new Error("title is missing")
    if (!type) throw new Error("type is missing")
    if (!fileType) throw new Error("fileType is missing")
    if (!fileSize) throw new Error("fileSize is missing")
    if (!extension) throw new Error("extension is missing")
    if (!fileName) throw new Error("fileName is missing")

    const { total_gb, used_gb } = await SchoolModel.getSchoolById(req.user.id);


    // Convert bytes → GB (float)
    const fileSizeInGB = fileSize / (1024 * 1024 * 1024);

    // Convert used_gb to number (it may be string)
    const usedGBNumeric = Number(used_gb) || 0;
    const totalGBNumeric = Number(total_gb) || 0;

    // Check storage limit
    if (usedGBNumeric + fileSizeInGB > totalGBNumeric) {
      return res
        .status(400)
        .json(apiResponse(false, "Storage limit exceeded. Please upgrade your plan or delete old files.", [], req.rrn));
    }

    const sizeMB = fileSize / (1024 * 1024); // Convert to MB
    if (sizeMB > 50) {
      throw new Error("50 MB Max")
    }

    const { uploadUrl, key } = await getUploadUrl_aws({ fileName, fileType, folder_name: 'school_' + req.user.id, UniqueFileName: type + "_" + req.rrn });

    await DocumentModel.updateDocumentList(req.user.id, type, title, key, fileSize);
    await SchoolModel.updateStorage(req.user.id, fileSize)

    return res.json(apiResponse(true, "Document Uploaded", { uploadUrl }, req.rrn));

  } catch (err) {
    next(err); // forward error to middleware
  }
};


export const documentList = async (req, res, next) => {

  try {

    const { type } = req.body;

    const data = await DocumentModel.getByType(req.user.id, type);
    if (!data || data.files.length == 0) {
      return res.json(apiResponse(true, "Document List", {}, req.rrn));
    }
    const files = data.files

    const updatedFiles = await Promise.all(
      files.map(async (item) => {
        item.url = await getCachedViewUrl(item.url);
        return item;
      })
    );

    return res.json(apiResponse(true, "Document List", updatedFiles, req.rrn));


  } catch (err) {
    next(err); // forward error to middleware
  }
};




export const UpdateDocument = async (req, res, next) => {

  try {

    const { title,
      fileName,
      type,
      fileIndex,
      fileType,
      fileSize, extension } = req.body;


    if (!title) throw new Error("title is missing")
    if (!type) throw new Error("type is missing")
    if (!fileType) throw new Error("fileType is missing")
    if (!fileSize) throw new Error("fileSize is missing")
    if (!extension) throw new Error("extension is missing")
    if (!fileName) throw new Error("fileName is missing")
    if (fileIndex < 0) throw new Error("fileIndex is missing")

    const { total_gb, used_gb } = await SchoolModel.getSchoolById(req.user.id);


    // Convert bytes → GB (float)
    const fileSizeInGB = fileSize / (1024 * 1024 * 1024);

    // Convert used_gb to number (it may be string)
    const usedGBNumeric = Number(used_gb) || 0;
    const totalGBNumeric = Number(total_gb) || 0;

    // Check storage limit
    if (usedGBNumeric + fileSizeInGB > totalGBNumeric) {
      return res
        .status(400)
        .json(apiResponse(false, "Storage limit exceeded. Please upgrade your plan or delete old files.", [], req.rrn));
    }



    const sizeMB = fileSize / (1024 * 1024); // Convert to MB
    if (sizeMB > 50) {
      throw new Error("50 MB Max")
    }

    const { uploadUrl, key } = await getUploadUrl_aws({ fileName, fileType, folder_name: 'school_' + req.user.id, UniqueFileName: type + "_" + req.rrn });

    const lastDocumentUrl = await DocumentModel.updateDocumentByIndex(req.user.id, type, title, key, fileSize, fileIndex);
    await deleteDoc_aws(lastDocumentUrl);
    await SchoolModel.updateStorage(req.user.id, fileSize)
    return res.json(apiResponse(true, "Document Updated", { uploadUrl }, req.rrn));


  } catch (err) {
    next(err); // forward error to middleware
  }
};


// export const deleteDocument = async (req, res, next) => {

//   try {

//     const { id, type } = req.body;
//     if (!type) throw new Error("type is missing")
//     if (id < 0) throw new Error("fileIndex is missing")

//     const fileIndex = id
//     const { lastDocumentUrl, sizeOldFile } = await DocumentModel.deleteDocumentByIndex(req.user.id, type, fileIndex);

//     await deleteDoc_aws(lastDocumentUrl);

//     // const schoolStorageBytes = await getFolderSize_aws('school_'+req.user.id)
//     // const in_gb = schoolStorageBytes/ 1024.0 / 1024.0 / 1024.0;
//     await SchoolModel.updateStorage(req.user.id, -sizeOldFile)


//     return res.json(apiResponse(true, "Document Deleted", {}, req.rrn));

//   } catch (err) {
//     next(err); // forward error to middleware
//   }
// };



export const studentDocumentUpload = async (req, res, next) => {

  try {

    const { year, student_id, title, type, fileType, fileSize, extension, fileName, enrollment_no } = req.body;

    if (!year) throw new Error("year is missing")
    if (!student_id) throw new Error("Student ID is missing")
    if (!title) throw new Error("title is missing")
    if (!type) throw new Error("type is missing")
    if (!fileType) throw new Error("fileType is missing")
    if (!fileSize) throw new Error("fileSize is missing")
    if (!extension) throw new Error("extension is missing")
    if (!fileName) throw new Error("fileName is missing")
    if (!enrollment_no) throw new Error("enrollment_no is missing")

    const { total_gb, used_gb } = await SchoolModel.getSchoolById(req.user.id);


    // Convert bytes → GB (float)
    const fileSizeInGB = fileSize / (1024 * 1024 * 1024);

    // Convert used_gb to number (it may be string)
    const usedGBNumeric = Number(used_gb) || 0;
    const totalGBNumeric = Number(total_gb) || 0;

    // Check storage limit
    if (usedGBNumeric + fileSizeInGB > totalGBNumeric) {
      return res
        .status(400)
        .json(apiResponse(false, "Storage limit exceeded. Please upgrade your plan or delete old files.", [], req.rrn));
    }

    const sizeMB = fileSize / (1024 * 1024); // Convert to MB
    if (sizeMB > 50) {
      throw new Error("50 MB Max")
    }

    const { uploadUrl, key } = await getUploadUrl_aws({ fileName, fileType, folder_name: 'school_' + req.user.id + "/S_" + student_id, UniqueFileName: type + "_" + req.rrn });

    await DocumentModel.updateStudentDocumentList(req.user.id, type, title, key, fileSize, year, student_id);
    await SchoolModel.updateStorage(req.user.id, fileSize)

    return res.json(apiResponse(true, "Document Uplaoded", { uploadUrl }, req.rrn));

  } catch (err) {
    next(err); // forward error to middleware
  }
};



export const getStudentDocument = async (req, res, next) => {

  try {

    const { student_id } = req.body;
    if (!student_id) throw new Error("Student Id is missing")

    const datas = await DocumentModel.getByStudentId(req.user.id, student_id);

    if (!datas || datas.length === 0) {
      return res.json(apiResponse(true, "Document List", [], req.rrn));
    }

    // final output array
    let allFiles = [];

    for (const data of datas) {
      if (!data.files || data.files.length === 0) continue;

      const updatedFiles = await Promise.all(
        data.files.map(async (item, i) => {
          item.o_url = item.url;
          item.download_url = await getDownloadUrl_aws(item.url);
          item.url = await getCachedViewUrl(item.url);
          item.type = data.document_type
          item.index = i
          return item;
        })
      );

      allFiles.push(...updatedFiles);
    }

    return res.json(apiResponse(true, "Document List", allFiles, req.rrn));


  } catch (err) {
    next(err); // forward error to middleware
  }
};


export const studentDocumentUpdate = async (req, res, next) => {

  try {

    const { title, year, type, student_id, fileType, fileSize, extension, fileName, index, enrollment_no } = req.body;

    const fileIndex = index;

    if (!title) throw new Error("title is missing")
    if (!year) throw new Error("year is missing")
    if (!type) throw new Error("type is missing")
    if (!student_id) throw new Error("student id is missing")

    if (!enrollment_no) throw new Error("enrollment_no is missing")

    if (fileType && fileName) {

      if (!fileType) throw new Error("fileType is missing")
      if (!fileSize) throw new Error("fileSize is missing")
      if (!extension) throw new Error("extension is missing")
      if (!fileName) throw new Error("fileName is missing")

      if (fileIndex < 0) throw new Error("fileIndex is missing")

      const { total_gb, used_gb } = await SchoolModel.getSchoolById(req.user.id);


      // Convert bytes → GB (float)
      const fileSizeInGB = fileSize / (1024 * 1024 * 1024);

      // Convert used_gb to number (it may be string)
      const usedGBNumeric = Number(used_gb) || 0;
      const totalGBNumeric = Number(total_gb) || 0;

      // Check storage limit
      if (usedGBNumeric + fileSizeInGB > totalGBNumeric) {
        return res
          .status(400)
          .json(apiResponse(false, "Storage limit exceeded. Please upgrade your plan or delete old files.", [], req.rrn));
      }



      const sizeMB = fileSize / (1024 * 1024); // Convert to MB
      if (sizeMB > 50) {
        throw new Error("50 MB Max")
      }

      const { uploadUrl, key } = await getUploadUrl_aws({ fileName, fileType, folder_name: 'school_' + req.user.id + "/S_" + student_id, UniqueFileName: type + "_" + req.rrn });

      const lastDocumentUrl = await DocumentModel.updateStudentDocumentByIndex(req.user.id, student_id, type, title, key, fileSize, fileIndex, year);
      await deleteDoc_aws(lastDocumentUrl);
      await SchoolModel.updateStorage(req.user.id, fileSize)
      return res.json(apiResponse(true, "Document Updated", { uploadUrl }, req.rrn));
    } else {
      await DocumentModel.updateStudentDocumentByIndex(req.user.id, student_id, type, title, null, null, fileIndex, year);
      return res.json(apiResponse(true, "Document Updated", {}, req.rrn));

    }


  } catch (err) {
    next(err); // forward error to middleware
  }
};


export const deleteStudentDocument = async (req, res, next) => {

  try {

    const { id, type, student_id } = req.body;
    if (!student_id) throw new Error("student id is missing")
    if (!type) throw new Error("type is missing")
    if (id < 0) throw new Error("fileIndex is missing")

    const fileIndex = id
    const { lastDocumentUrl, sizeOldFile } = await DocumentModel.deleteStudentDocumentByIndex(req.user.id, student_id, type, fileIndex);

    await deleteDoc_aws(lastDocumentUrl);

    // const schoolStorageBytes = await getFolderSize_aws('school_'+req.user.id)
    // const in_gb = schoolStorageBytes/ 1024.0 / 1024.0 / 1024.0;
    await SchoolModel.updateStorage(req.user.id, -sizeOldFile)


    return res.json(apiResponse(true, "Document Deleted", {}, req.rrn));

  } catch (err) {
    next(err); // forward error to middleware
  }
};




export const TeacherDocumentUpload = async (req, res, next) => {

  try {

    const { year, teacher_id, title, type, fileType, fileSize, extension, fileName, teacher_school_id } = req.body;

    if (!year) throw new Error("year is missing")
    if (!teacher_id) throw new Error("Teacher ID is missing")
    if (!title) throw new Error("title is missing")
    if (!type) throw new Error("type is missing")
    if (!fileType) throw new Error("fileType is missing")
    if (!fileSize) throw new Error("fileSize is missing")
    if (!extension) throw new Error("extension is missing")
    if (!fileName) throw new Error("fileName is missing")
    if (!teacher_school_id) throw new Error("teacher_school_id is missing")

    const { total_gb, used_gb } = await SchoolModel.getSchoolById(req.user.id);


    // Convert bytes → GB (float)
    const fileSizeInGB = fileSize / (1024 * 1024 * 1024);

    // Convert used_gb to number (it may be string)
    const usedGBNumeric = Number(used_gb) || 0;
    const totalGBNumeric = Number(total_gb) || 0;

    // Check storage limit
    if (usedGBNumeric + fileSizeInGB > totalGBNumeric) {
      return res
        .status(400)
        .json(apiResponse(false, "Storage limit exceeded. Please upgrade your plan or delete old files.", [], req.rrn));
    }

    const sizeMB = fileSize / (1024 * 1024); // Convert to MB
    if (sizeMB > 50) {
      throw new Error("50 MB Max")
    }

    const { uploadUrl, key } = await getUploadUrl_aws({ fileName, fileType, folder_name: 'school_' + req.user.id + "/T_" + teacher_id, UniqueFileName: type + "_" + req.rrn });

    await DocumentModel.updateTeacherDocumentList(req.user.id, type, title, key, fileSize, year, teacher_id);
    await SchoolModel.updateStorage(req.user.id, fileSize)

    return res.json(apiResponse(true, "Document Uplaoded", { uploadUrl }, req.rrn));

  } catch (err) {
    next(err); // forward error to middleware
  }
};


export const getTeacherDocument = async (req, res, next) => {

  try {

    const { teacher_id } = req.body;
    if (!teacher_id) throw new Error("Student Id is missing")

    const datas = await DocumentModel.getByTeacherId(req.user.id, teacher_id);

    if (!datas || datas.length === 0) {
      return res.json(apiResponse(true, "Document List", [], req.rrn));
    }

    // final output array
    let allFiles = [];

    for (const data of datas) {
      if (!data.files || data.files.length === 0) continue;

      const updatedFiles = await Promise.all(
        data.files.map(async (item, i) => {
          item.o_url = item.url;
          item.download_url = await getDownloadUrl_aws(item.url);
          item.url = await getCachedViewUrl(item.url);
          item.type = data.document_type
          item.index = i
          return item;
        })
      );

      allFiles.push(...updatedFiles);
    }

    return res.json(apiResponse(true, "Document List", allFiles, req.rrn));


  } catch (err) {
    next(err); // forward error to middleware
  }
};



export const TeacherDocumentUpdate = async (req, res, next) => {

  try {

    const { title, year, type, teacher_id, fileType, fileSize, extension, fileName, index, teacher_school_id } = req.body;

    const fileIndex = index;

    if (!title) throw new Error("title is missing")
    if (!year) throw new Error("year is missing")
    if (!type) throw new Error("type is missing")
    if (!teacher_id) throw new Error("teacher id is missing")

    if (!teacher_school_id) throw new Error("teacher School id is missing")

    if (fileType && fileName) {

      if (!fileType) throw new Error("fileType is missing")
      if (!fileSize) throw new Error("fileSize is missing")
      if (!extension) throw new Error("extension is missing")
      if (!fileName) throw new Error("fileName is missing")
      if (fileIndex < 0) throw new Error("fileIndex is missing")

      const { total_gb, used_gb } = await SchoolModel.getSchoolById(req.user.id);


      // Convert bytes → GB (float)
      const fileSizeInGB = fileSize / (1024 * 1024 * 1024);

      // Convert used_gb to number (it may be string)
      const usedGBNumeric = Number(used_gb) || 0;
      const totalGBNumeric = Number(total_gb) || 0;

      // Check storage limit
      if (usedGBNumeric + fileSizeInGB > totalGBNumeric) {
        return res
          .status(400)
          .json(apiResponse(false, "Storage limit exceeded. Please upgrade your plan or delete old files.", [], req.rrn));
      }



      const sizeMB = fileSize / (1024 * 1024); // Convert to MB
      if (sizeMB > 50) {
        throw new Error("50 MB Max")
      }

      const { uploadUrl, key } = await getUploadUrl_aws({ fileName, fileType, folder_name: 'school_' + req.user.id + "/T_" + teacher_id, UniqueFileName: type + "_" + req.rrn });

      const lastDocumentUrl = await DocumentModel.updateTeacherDocumentByIndex(req.user.id, teacher_id, type, title, key, fileSize, fileIndex, year);

      await deleteDoc_aws(lastDocumentUrl);
      await SchoolModel.updateStorage(req.user.id, fileSize)
      return res.json(apiResponse(true, "Document Updated", { uploadUrl }, req.rrn));
    } else {
      await DocumentModel.updateTeacherDocumentByIndex(req.user.id, teacher_id, type, title, null, null, fileIndex, year);
      return res.json(apiResponse(true, "Document Updated", {}, req.rrn));

    }

  } catch (err) {
    next(err); // forward error to middleware
  }
};



export const deleteTeacherDocument = async (req, res, next) => {

  try {

    const { id, type, teacher_id } = req.body;
    if (!teacher_id) throw new Error("student id is missing")
    if (!type) throw new Error("type is missing")
    if (id < 0) throw new Error("fileIndex is missing")

    const fileIndex = id
    const { lastDocumentUrl, sizeOldFile } = await DocumentModel.deleteTeacherDocumentByIndex(req.user.id, teacher_id, type, fileIndex);

    await deleteDoc_aws(lastDocumentUrl);

    // const schoolStorageBytes = await getFolderSize_aws('school_'+req.user.id)
    // const in_gb = schoolStorageBytes/ 1024.0 / 1024.0 / 1024.0;
    await SchoolModel.updateStorage(req.user.id, -sizeOldFile)


    return res.json(apiResponse(true, "Document Deleted", {}, req.rrn));

  } catch (err) {
    next(err); // forward error to middleware
  }
};

export const cronUpdateSchoolStorage = async (req, res) => {

  const allSchool = await SchoolModel.getAllSchools_OnlyId();

  allSchool.map(async (item) => {

    const FolderName = 'school_' + item.school_id;

    const getAWS_Used_Storage_bytes = await getFolderSize_aws(FolderName)

    const usedGb = getAWS_Used_Storage_bytes / 1024.0 / 1024.0 / 1024.0
    // console.log(FolderName +" : "+usedGb);

    await SchoolModel.updateSchool(item.school_id, { used_gb: usedGb })

  })

  return "Done";

};

export const teacherDocumentDownload = async (req, res, next) => {

  try {

    const { teacher_id } = req.body;
    if (!teacher_id) throw new Error("Student Id is missing")

    const documents = await DocumentModel.getByTeacherId(req.user.id, teacher_id);

    // final output array
    let allFiles = [];

    for (const data of documents) {
      if (!data.files || data.files.length === 0) continue;

      const updatedFiles = await Promise.all(
        data.files.map(async (item, i) => {
          item.o_url = item.url;
          item.download_url = await getDownloadUrl_aws(item.url);
          item.url = await getCachedViewUrl(item.url);
          item.type = data.document_type
          item.index = i
          return item;
        })
      );

      allFiles.push(...updatedFiles);
    }


    if (allFiles.length === 0) {
      return res.status(400).json({ message: "No documents found" });
    }


    return downloadMultipleFromS3(allFiles, res);

  } catch (err) {
    next(err); // forward error to middleware
  }
};



export const studentDocumentDownload = async (req, res, next) => {

  try {

    const { student_id } = req.body;
    if (!student_id) throw new Error("Student Id is missing")

    const documents = await DocumentModel.getByStudentId(req.user.id, student_id);

    // final output array
    let allFiles = [];

    for (const data of documents) {
      if (!data.files || data.files.length === 0) continue;

      const updatedFiles = await Promise.all(
        data.files.map(async (item, i) => {
          item.o_url = item.url;
          item.download_url = await getDownloadUrl_aws(item.url);
          item.url = await getCachedViewUrl(item.url);
          item.type = data.document_type
          item.index = i
          return item;
        })
      );

      allFiles.push(...updatedFiles);
    }


    if (allFiles.length === 0) {
      return res.status(400).json(apiResponse(false, "No Document Found", {}, req.rrn));

    }


    return downloadMultipleFromS3(allFiles, res);

  } catch (err) {
    next(err); // forward error to middleware
  }
};


// New code

export const NewTemplates = async (req, res, next) => {

  try {

    const { templateName, image, fields } = req.body;

    if (!templateName) throw new Error("Template Name is missing");
    if (!image) throw new Error("Image is missing");
    if (!fields || fields.length === 0) throw new Error("Fields are missing");


    const { total_gb, used_gb } = await SchoolModel.getSchoolById(req.user.id);

    const fileSize = image.size
    const fileType = image.type
    const fileName = image.name

    // Convert bytes → GB (float)
    const fileSizeInGB = fileSize / (1024 * 1024 * 1024);

    // Convert used_gb to number (it may be string)
    const usedGBNumeric = Number(used_gb) || 0;
    const totalGBNumeric = Number(total_gb) || 0;

    // Check storage limit
    if (usedGBNumeric + fileSizeInGB > totalGBNumeric) {
      return res
        .status(400)
        .json(apiResponse(false, "Storage limit exceeded. Please upgrade your plan or delete old files.", [], req.rrn));
    }

    const sizeMB = fileSize / (1024 * 1024); // Convert to MB
    if (sizeMB > 50) {
      throw new Error("50 MB Max")
    }

    const { uploadUrl, key } = await getUploadUrl_aws({ fileName, fileType, folder_name: 'school_' + req.user.id + "/Template", UniqueFileName: templateName + "_" + req.rrn });

    await SchoolModel.updateStorage(req.user.id, fileSize)

    await SchoolTemplateModel.createTemplate({ school_id: req.user.id, name: templateName, url: key, fields });

    return res.json(apiResponse(true, "Template Created Successfully", { uploadUrl }, req.rrn));

  } catch (err) {
    next(err); // forward error to middleware
  }
};


export const getTemplates = async (req, res, next) => {

  try {

    const templates_temp = await SchoolTemplateModel.findBySchoolId(req.user.id);

     const templates = await Promise.all(
      templates_temp.map(async (item) => {
        item.url = await getCachedViewUrl(item.url);
        return item;
      })
    );


    return res.json(apiResponse(true, "Templates fetched successfully", templates, req.rrn));
    
  } catch (err) {
    next(err); // forward error to middleware
  }
};

export const getPreSignedUrls = async (req, res, next) => {

  try {


    const { templateId, files } = req.body;

    if (!templateId) throw new Error("Template ID is missing");
    if (!files || files.length === 0) throw new Error("Files are missing");


    const template = await SchoolTemplateModel.findById(templateId);
    if (!template) throw new Error("Template not found");

    const fields = template.fields;

    const preSignedUrls = await Promise.all(
      files.map(async (file, index) => {
        const { fileName, fileType } = file;
        if (!fileName) throw new Error("File Name is missing");
        if (!fileType) throw new Error("File Type is missing");

        const { uploadUrl, key } = await getUploadUrl_aws({ fileName, fileType, folder_name: 'school_' + req.user.id, UniqueFileName: templateId + "_" + req.rrn + "_" + index });

        const newDocument = await UploadDocumentModel.createDocument({
          template_fields: fields,
          school_id: req.user.id,
          school_template_id: templateId,
          ai_res: "{}",
          original_file: key,
          template_file: "/pending",
          status: "Pending",
        })

        return { uploadUrl, key, document_id: newDocument.document_id, fileName };
      })
    );

    return res.json(apiResponse(true, "Pre-signed URLs generated successfully", preSignedUrls, req.rrn));

  } catch (err) {
    next(err); // forward error to middleware
  }
};

export const completeUpload_scan = async (req, res, next) => {
  try {

    const { templateId, documentIds } = req.body;

    if (!templateId) throw new Error("Template ID is missing");
    if (!documentIds || documentIds.length === 0) throw new Error("Document IDs are missing");

    const documents = await UploadDocumentModel.findByIds(documentIds);
    const result = [];
    // console.log(documents)
    await Promise.all(
      documents.map(async (doc) => {
        const Aws_url = await getCachedViewUrl(doc.original_file);
        const Fields = doc.template_fields.map(f => f.id);

        const ai_res = await extractFormFields_aws(
          Aws_url,
          Fields.toString()
        );

        const updatedDoc = await UploadDocumentModel.updateDocument(doc.document_id, {
          ai_res: JSON.stringify(ai_res)
        });

        result.push({ doc: updatedDoc, Aws_url, Fields })
      })
    );

    // console.log(result)
    return res.json(apiResponse(true, "Documents completed successfully", result, req.rrn));

  } catch (err) {
    next(err); // forward error to middleware
  }
}

export const GenerateScanDocument = async (req, res, next) => {
  try {

    const { DocIds } = req.body;

    if (!DocIds || DocIds.length === 0) throw new Error("Document IDs are missing");
    const documents = await UploadDocumentModel.findByIds(DocIds);


    await Promise.all(
      documents.map(async (doc) => {
        try {

          const template_id = doc.school_template_id;
          const Fields = doc.template_fields;
          const ai_res = doc.ai_res;

          const template = await SchoolTemplateModel.findById(template_id);
          const template_url = await getCachedViewUrl(template.url);

          console.log(template_url)
          console.log(Fields)
          console.log(ai_res)

          const scanCopyUrl = await fillTemplate(template_url, Fields, ai_res, req.user.id);

          await UploadDocumentModel.updateDocument(doc.document_id, {
            template_file: scanCopyUrl,
            status: "Completed",
          });

        } catch (err) {
          console.error(err)
        }
      })
    )

    return res.json(apiResponse(true, "Documents Scan successfully", {}, req.rrn));

  } catch (err) {
    next(err); // forward error to middleware
  }
}

export const getAllSchoolDocuments = async (req, res, next) => {
  try {

    const Documents = await UploadDocumentModel.findBySchoolId(req.user.id);


    const updatedData = await Promise.all(
      Documents.map(async (item) => {
        if (item.template_file) {
          item.template_file = await getViewUrl_aws_download(item.template_file);
        }

        if (item.original_file) {
          item.original_file = await getCachedViewUrl(item.original_file);
        }

        
        return item;
      })
    );


    return res.json(apiResponse(true, "Documents ", updatedData, req.rrn));
    

  } catch (err) {
    next(err); // forward error to middleware
  }
}

export const deleteTemplate = async (req, res, next) => {
  try {

    const { id } = req.body;

    if(!id) throw new Error("Template ID is missing"); 

    const template = await SchoolTemplateModel.findById(id);

    await deleteDoc_aws(template.url);
    
    await SchoolTemplateModel.deleteTemplate(id);

    return res.json(apiResponse(true, "Template Deleted", {}, req.rrn));

  } catch (err) {
    next(err); // forward error to middleware
  }
}


export const deleteDocument = async (req, res, next) => {
  try {

    const { id } = req.body;

    if(!id) throw new Error("Document ID is missing"); 

    const document = await UploadDocumentModel.findById(id);

    await deleteDoc_aws(document.template_file);
    await deleteDoc_aws(document.original_file);
    
    await UploadDocumentModel.deleteDocument(id);

    return res.json(apiResponse(true, "Document Deleted", {}, req.rrn));

  } catch (err) {
    next(err); // forward error to middleware
  }
}