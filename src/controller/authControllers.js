import { SchoolModel } from "../models/schoolModel.js";
import apiResponse from "../utils/apiResponse.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json(apiResponse(false, "Email and password are required", [], req.rrn));
    }

    const user = await SchoolModel.getSchoolByEmail(email);
    if (!user) {
      return res
        .status(200)
        .json(apiResponse(false, "Invalid email or password", [], req.rrn));
    }

    if(!user.status){
       return res
        .status(200)
        .json(apiResponse(false, "Account is Locked", [], req.rrn));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(200)
        .json(apiResponse(false, "Invalid email or password", [], req.rrn));
    }

    // ✅ Generate JWT token
    const token = jwt.sign(
      { id: user.school_id, role: 'school', email: user.email }, // payload
      process.env.JWT_SECRET, // secret key
      { expiresIn: process.env.JWT_EXPIRES_IN } // expiry time
    );

    // ✅ Send response with token
    return res.json(
      apiResponse(
        true,
        "Login successful",
        {
          adminId: user.id,
          name: user.name,
          email: user.email,
          token, // attach token
          role: 'school'
        },
        req.rrn
      )
    );
  } catch (err) {
    next(err);
  }
};
