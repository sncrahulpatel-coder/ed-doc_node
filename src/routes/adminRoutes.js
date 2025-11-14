import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { createUploader } from "../middleware/uploadMiddleware.js";
import { adminLogin, getStudents, planById, planDelete, plansAdd, plansData, planToggleStatus, planUpdate, registerAdmin, schoolList, schoolRegister, updateSchoolPlan, updateSchoolStatus } from "../controller/adminControllers.js";


const router = express.Router();
const excelUpload = createUploader("uploads/excel", "snc-kit-upload");

router.post("/register", registerAdmin);
router.post("/login",adminLogin);

router.post("/", authenticate, authorize(["teacher", "admin"]), getStudents);
router.post("/school/register", authenticate, authorize(["admin"]), schoolRegister);
router.get("/SchoolList", authenticate, authorize(["admin"]), schoolList);
router.get("/plans", authenticate, authorize(["admin"]), plansData);
router.post("/plans", authenticate, authorize(["admin"]), plansAdd);
router.get("/plans/:id",authenticate, authorize(["admin"]),  planById);
router.post("/plans/:id",authenticate, authorize(["admin"]),  planUpdate);
router.delete("/plans/:id",authenticate, authorize(["admin"]),  planDelete);
router.patch("/plans/:id/toggle",authenticate, authorize(["admin"]),  planToggleStatus);
router.put("/updateSchoolStatus/:id", authenticate, authorize(["admin"]), updateSchoolStatus);
router.put("/updateSchoolPlan/:id", authenticate, authorize(["admin"]), updateSchoolPlan);

export default router;
