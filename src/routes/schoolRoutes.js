import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { createUploader } from "../middleware/uploadMiddleware.js";
import { addStudent, addStudentBulk, completeUpload_scan, dashboardData, deleteDocument, deleteStudentDocument, deleteTeacherDocument, deleteTemplate, documentList, GenerateScanDocument, getAllSchoolDocuments, getPreSignedUrls, getStudentDocument, getStudentList, getTeacherDocument, getTeacherList, getTemplates, NewTemplates, schoolAddTeacher, studentDocumentDownload, studentDocumentUpdate, studentDocumentUpload, studentUpdate, teacherDocumentDownload, TeacherDocumentUpdate, TeacherDocumentUpload, UpdateDocument, UpdateTeacher, uploadDocument } from "../controller/schoolControllers.js";


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
// router.post("/deleteDocument", authenticate, authorize(["school"]), deleteDocument);

router.post("/StudentDocumentUpload", authenticate, authorize(["school"]), studentDocumentUpload);
router.post("/getStudentDocument", authenticate, authorize(["school"]), getStudentDocument);
router.post("/StudentDocumentUpdate", authenticate, authorize(["school"]), studentDocumentUpdate );
router.post("/deleteStudentDocument", authenticate, authorize(["school"]), deleteStudentDocument);

// Teachers
router.post("/TeacherDocumentUpload", authenticate, authorize(["school"]), TeacherDocumentUpload);
router.post("/getTeacherDocument", authenticate, authorize(["school"]), getTeacherDocument);
router.post("/TeacherDocumentUpdate", authenticate, authorize(["school"]), TeacherDocumentUpdate );
router.post("/deleteTeacherDocument", authenticate, authorize(["school"]), deleteTeacherDocument);

router.post("/TeacherDocumentDownload", authenticate, authorize(["school"]), teacherDocumentDownload);
router.post("/StudentDocumentDownload", authenticate, authorize(["school"]), studentDocumentDownload);

router.post("/NewTemplates", authenticate, authorize(["school"]), NewTemplates);
router.get("/templates", authenticate, authorize(["school"]), getTemplates);
router.post("/scan/presigned-urls", authenticate, authorize(["school"]), getPreSignedUrls);
router.post("/scan/complete-upload", authenticate, authorize(["school"]), completeUpload_scan);
router.post("/GenerateScanDocument", authenticate, authorize(["school"]), GenerateScanDocument);
router.get("/documents", authenticate, authorize(["school"]), getAllSchoolDocuments);
router.post("/deleteTemplate", authenticate, authorize(["school"]), deleteTemplate);
router.post("/deleteDocument", authenticate, authorize(["school"]), deleteDocument);



export default router;
