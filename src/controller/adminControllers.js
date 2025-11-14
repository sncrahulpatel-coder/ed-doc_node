import apiResponse from "../utils/apiResponse.js";
import { AdminModel } from '../models/adminModel.js'
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SchoolModel } from "../models/schoolModel.js";
import { getCachedViewUrl, getUploadUrl_aws } from "../aws/aws3.js";
import { PlansModel } from "../models/PlansModel.js";

export const registerAdmin = async (req, res, next) => {
  try {

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json(apiResponse(false, "Name, email, and password are required", [], req.rrn));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingAdmin = await AdminModel.findByEmail(email);
    if (existingAdmin) {
      return res.status(409).json(apiResponse(false, "Admin with this email already exists", [], req.rrn));
    }

    await AdminModel.registerAdmin({ name, email, password: hashedPassword });

    return res.json(apiResponse(true, "Admin Registered", [], req.rrn));

  } catch (err) {
    next(err);
  }
}

export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json(apiResponse(false, "Email and password are required", [], req.rrn));
    }

    const admin = await AdminModel.findByEmail(email);
    if (!admin) {
      return res
        .status(200)
        .json(apiResponse(false, "Invalid email or password", [], req.rrn));
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res
        .status(200)
        .json(apiResponse(false, "Invalid email or password", [], req.rrn));
    }

    // ✅ Generate JWT token
    const token = jwt.sign(
      { id: admin.id, role: "admin", email: admin.email }, // payload
      process.env.JWT_SECRET, // secret key
      { expiresIn: process.env.JWT_EXPIRES_IN } // expiry time
    );

    // ✅ Send response with token
    return res.json(
      apiResponse(
        true,
        "Login successful",
        {
          adminId: admin.id,
          name: admin.name,
          email: admin.email,
          token, // attach token
          role: 'admin'
        },
        req.rrn
      )
    );
  } catch (err) {
    next(err);
  }
};

export const getStudents = async (req, res, next) => {
  try {
    // const students = await StudentModel.getAllStudents();
    return res.json(apiResponse(true, "Students fetched", {}, req.rrn));
  } catch (err) {
    next(err);
  }
};

export const schoolRegister = async (req, res, next) => {
  try {
    const {
      schoolName,
      address,
      phone,
      email,
      yearOfEstablishment,
      totalStandard,
      totalStudents,
      totalTeachers,
      totalSubjects,
      image
    } = req.body;

    // Basic required field validation
    if (
      !schoolName ||
      !address ||
      !phone ||
      !email ||
      !yearOfEstablishment ||
      !totalStandard ||
      !totalStudents ||
      !totalTeachers ||
      !totalSubjects
    ) {
      return res.status(400).json(apiResponse(false, "All fields are required"));
    }

    // Validate phone number
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json(apiResponse(false, "Invalid phone number (must be 10 digits)"));
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json(apiResponse(false, "Invalid email address"));
    }

    // Validate year of establishment (1900 - current year)
    const currentYear = new Date().getFullYear();
    if (
      !/^(19|20)\d{2}$/.test(yearOfEstablishment) ||
      parseInt(yearOfEstablishment) > currentYear
    ) {
      return res.status(400).json(apiResponse(false, "Invalid year of establishment"));
    }

    if (!image) {
      return res.status(400).json(apiResponse(false, "Please Provide Image"));
    }

    if (image.size > 300 * 1024) {
      return res.status(400).json(apiResponse(false, "Max Size 300Kb"));
    }


    // Validate numeric fields
    const numericFields = {
      totalStudents,
      totalTeachers,
      totalSubjects,
    };

    for (const [key, value] of Object.entries(numericFields)) {
      if (isNaN(value) || Number(value) <= 0) {
        return res.status(400).json(apiResponse(false, `${key} must be a positive number`));
      }
    }

    const school = await SchoolModel.getSchoolByEmail(email);
    if (school) {
      return res.status(400).json(apiResponse(false, `Email Already Exists`));
    }

    // Auto-generate a simple password based on phone (⚠️ for production, use random/secure password)
    const password = phone + "@123";
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create school record
    const schoolNew = await SchoolModel.createSchool({
      school_name: schoolName,
      address,
      number: phone,
      email,
      password: hashedPassword,
      year_of_establishment: yearOfEstablishment,
      total_standard: totalStandard,
      total_students: totalStudents,
      total_teachers: totalTeachers,
      total_subjects: totalSubjects,
    });

    const uploadUrl = await getUploadUrl_aws({ fileName: image.name, fileType: image.type, folder_name: 'school_' + schoolNew.school_id, UniqueFileName: 'logo' })

    await SchoolModel.updateSchoolLogo(schoolNew.school_id, { logo: uploadUrl.key })

    return res.json(apiResponse(true, "School registered successfully", { uploadUrl: uploadUrl.uploadUrl }, req.rrn));
  } catch (err) {
    console.error("Error in schoolRegister:", err);
    next(err);
  }
};

export const schoolList = async (req, res, next) => {
  try {

    const data = await SchoolModel.getAllSchools();

    const updatedData = await Promise.all(
      data.map(async (item) => {
        const logoAws = await getCachedViewUrl(item.logo);
        return { ...item, logo: logoAws };
      })
    );

    return res.json(apiResponse(true, "School Added", updatedData, req.rrn));


  } catch (err) {
    next(err);
  }
};



export const plansData = async (req, res, next) => {
  try {

    const data = await PlansModel.showAllPlans();

    return res.json(apiResponse(true, "Plans Data", data, req.rrn));


  } catch (err) {
    next(err);
  }
};


export const plansAdd = async (req, res, next) => {
  try {
    const { plan_name, gb, status } = req.body;

    // Validation
    if (!plan_name || !gb) {
      return res
        .status(400)
        .json(apiResponse(false, "Plan name and GB are required", [], req.rrn));
    }

    const plan = await PlansModel.createPlan({
      plan_name,
      gb,
      status: status ?? true,
    });

    return res.json(apiResponse(true, "Plan added successfully", plan, req.rrn));
  } catch (err) {
    next(err);
  }
};

export const plansList = async (req, res, next) => {
  try {
    const plans = await PlansModel.showAllPlans();
    return res.json(apiResponse(true, "Plans fetched successfully", plans, req.rrn));
  } catch (err) {
    next(err);
  }
};

export const planById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await PlansModel.getPlanById(id);

    if (!plan) {
      return res
        .status(404)
        .json(apiResponse(false, "Plan not found", [], req.rrn));
    }

    return res.json(apiResponse(true, "Plan fetched successfully", plan, req.rrn));
  } catch (err) {
    next(err);
  }
};

export const planUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { plan_name, gb, status } = req.body;

    const existingPlan = await PlansModel.getPlanById(id);
    if (!existingPlan) {
      return res
        .status(404)
        .json(apiResponse(false, "Plan not found", [], req.rrn));
    }

    const updatedPlan = await PlansModel.updatePlan(id, {
      plan_name,
      gb,
      status,
    });

    return res.json(apiResponse(true, "Plan updated successfully", updatedPlan, req.rrn));
  } catch (err) {
    next(err);
  }
};

export const planDelete = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingPlan = await PlansModel.getPlanById(id);
    if (!existingPlan) {
      return res
        .status(404)
        .json(apiResponse(false, "Plan not found", [], req.rrn));
    }

    const deletedPlan = await PlansModel.togglePlanStatus(id);
    return res.json(apiResponse(true, "Plan deleted successfully", deletedPlan, req.rrn));
  } catch (err) {
    next(err);
  }
};

export const planToggleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingPlan = await PlansModel.getPlanById(id);
    if (!existingPlan) {
      return res
        .status(404)
        .json(apiResponse(false, "Plan not found", [], req.rrn));
    }

    const updatedPlan = await PlansModel.togglePlanStatus(id);
    return res.json(apiResponse(true, "Plan status toggled", updatedPlan, req.rrn));
  } catch (err) {
    next(err);
  }
};



export const updateSchoolStatus = async (req, res, next) => {
  try {

    const { status } = req.body;
    const {id} = req.params;

    await SchoolModel.updateSchool(id,{status})

    return res.json(apiResponse(true, "School Status Updated", {}, req.rrn));

  } catch (err) {
    next(err);
  }
};



export const updateSchoolPlan = async (req, res, next) => {
  try {

    const { plan_id } = req.body;
    const {id} = req.params;

    const planDetails = await PlansModel.getPlanById(plan_id);

    if(!planDetails){
      return res
        .status(404)
        .json(apiResponse(false, "Plan not found", [], req.rrn));
    }

    await SchoolModel.updateSchool(id,{plan_id:planDetails.plan_id,total_gb:planDetails.gb})

    return res.json(apiResponse(true, "School Status Updated", {}, req.rrn));

  } catch (err) {
    next(err);
  }
};
