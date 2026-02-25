import express from "express";
import authMiddleware from "../middleware/isAuthorized.js";
import {
  createModule,
  updateModule,
  deleteModule,
  getModules,
  getModuleById,
  startModule,
  updateProgress,
  completeModule,
  getUserProgress,
} from "../controllers/moduleController.js";
import { checkRoles } from "../middleware/checkRoles.js";

const router = express.Router();

// Admin routes
router.post("/new", authMiddleware, checkRoles(["ADMIN"]), createModule);
router.put("/:id", authMiddleware, checkRoles(["ADMIN"]), updateModule);
router.delete("/:id", authMiddleware, checkRoles(["ADMIN"]), deleteModule);

// User routes
router.get("/", getModules);
router.get("/:id", authMiddleware, getModuleById);
router.post("/:id/start", authMiddleware, startModule);
router.patch("/:id/progress", authMiddleware, updateProgress);
router.post("/:id/complete", authMiddleware, completeModule);
router.get("/user/progress/dashboard", authMiddleware, getUserProgress);

export default router;
