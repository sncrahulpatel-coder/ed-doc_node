import apiResponse from "../utils/apiResponse.js";
import { SchoolModel } from "../models/schoolModel.js";
import { getCachedViewUrl } from "../aws/aws3.js";
import { PlansModel } from "../models/PlansModel.js";
import { StudentsModel } from "../models/StudentsModel.js";
import fs from "fs";
import xlsx from "xlsx";

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
      address
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
    await StudentsModel.createStudent({
        school_id:req.user.id,
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

    // -------------------------------
    // 5️⃣ SUCCESS RESPONSE
    // -------------------------------
    return res.json(apiResponse(true, "Student Added Successfully", {}, req.rrn));

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
        school_id:req.user.id,
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

    return res.json(apiResponse(true, "School Data", data, req.rrn));

  } catch (err) {
    next(err);
  }
};