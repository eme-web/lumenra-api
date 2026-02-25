import express from "express";
import authMiddleware from "../middleware/isAuthorized.js";
import { checkRoles } from "../middleware/checkRoles.js";

import {
  addModuleContent,
  updateModuleContent,
  deleteModuleContent,
  getModuleContents,
} from "../controllers/moduleContentController.js";

const router = express.Router();

// Admin only
router.post(
  "/:moduleId",
  authMiddleware,
  checkRoles(["ADMIN"]),
  addModuleContent,
);
router.put("/:id", authMiddleware, checkRoles(["ADMIN"]), updateModuleContent);
router.delete(
  "/:id",
  authMiddleware,
  checkRoles(["ADMIN"]),
  deleteModuleContent,
);

// Public (or authenticated)
router.get("/:moduleId", getModuleContents);

export default router;
