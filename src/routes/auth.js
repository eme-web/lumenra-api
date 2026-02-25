import express from "express";
import {
  register,
  login,
  updateUser,
  forgotPassword,
  resetPassword,
  verifyOtp,
  savePersonalityCheck,
  deleteUser,
} from "../controllers/auth.js";
import authMiddleware from "../middleware/isAuthorized.js";
import { checkRoles } from "../middleware/checkRoles.js";
import validators from "../validator/validators.js";

const router = express.Router();

router.post(
  "/register",
  [
    validators.emailValidator,
    validators.passwordValidator,
    validators.userNameValidator,
    validators.roleValidator,
  ],
  register,
);
router.post("/login", [validators.loginInputValidator], login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/personality-check", authMiddleware, savePersonalityCheck); // protected
router.patch("/update/:userId", updateUser);
router.delete("/delete/:id", authMiddleware, checkRoles(["ADMIN"]), deleteUser);

export default router;
