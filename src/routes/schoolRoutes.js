import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { createUploader } from "../middleware/uploadMiddleware.js";
import { addStudent, addStudentBulk, dashboardData, getStudentList } from "../controller/schoolControllers.js";


const router = express.Router();
const excelUpload = createUploader("uploads/excel", "studentList");

router.get("/dashboard", authenticate, authorize(["school"]), dashboardData);
router.post("/AddStudent", authenticate, authorize(["school"]), addStudent);
router.post("/AddStudentExcel", authenticate, authorize(["school"]),excelUpload.single("excelFile"), addStudentBulk);
router.get("/getStudentList", authenticate, authorize(["school"]), getStudentList);

export default router;
