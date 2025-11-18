import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { createUploader } from "../middleware/uploadMiddleware.js";
import { addStudent, addStudentBulk, dashboardData, deleteDocument, documentList, getStudentList, getTeacherList, schoolAddTeacher, studentUpdate, UpdateDocument, UpdateTeacher, uploadDocument } from "../controller/schoolControllers.js";


const router = express.Router();
const excelUpload = createUploader("uploads/excel", "studentList");

router.get("/dashboard", authenticate, authorize(["school"]), dashboardData);
router.post("/AddStudent", authenticate, authorize(["school"]), addStudent);
router.post("/AddStudentExcel", authenticate, authorize(["school"]),excelUpload.single("excelFile"), addStudentBulk);
router.get("/getStudentList", authenticate, authorize(["school"]), getStudentList);
router.post('/AddTeacher', authenticate, authorize(["school"]), schoolAddTeacher);
router.get('/getTeacherList', authenticate, authorize(["school"]), getTeacherList);
router.put('/UpdateStudent/:id', authenticate, authorize(["school"]), studentUpdate);
router.put('/UpdateTeacher', authenticate, authorize(["school"]), UpdateTeacher);

router.post("/document/get-upload-url", authenticate, authorize(["school"]), uploadDocument);
router.post("/DocumentList", authenticate, authorize(["school"]), documentList);
router.post("/UpdateDocument", authenticate, authorize(["school"]), UpdateDocument);
router.post("/deleteDocument", authenticate, authorize(["school"]), deleteDocument);


export default router;
