// routes/category.routes.ts

import express from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

import authMiddleware from "../middleware/isAuthorized.js";
import { checkRoles } from "../middleware/checkRoles.js";

const router = express.Router();

router.post("/new", authMiddleware, checkRoles(["ADMIN"]), createCategory);
router.get("/", getCategories);
router.put("/:id", authMiddleware, checkRoles(["ADMIN"]), updateCategory);
router.delete("/:id", authMiddleware, checkRoles(["ADMIN"]), deleteCategory);

export default router;
