import express from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyOtp,
  savePersonalityCheck,
} from "../controllers/auth.js";
import authMiddleware from "../middleware/isAuthorized.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/personality-check", authMiddleware, savePersonalityCheck); // protected

export default router;
