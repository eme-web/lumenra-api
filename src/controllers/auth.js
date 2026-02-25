import dotenv from "dotenv";
dotenv.config();
import prisma from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { sendBrevoMail } from "../services/mail.js";
import setPassword from "../mails/reset-password.js";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const register = async (req, res) => {
  const { fullName, email, password, role } = req.body;

  if (!fullName || !email || !password) {
    return res
      .status(400)
      .json({ message: "Full name, email, password are required " });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: `A user with this email already exist` });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role: role || "USER",
      },
    });

    return res.status(201).json({
      message: `Registration successful`,
      user: { id: user.id, email: user.email, fullName: user.fullName },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Internal server error` });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid Login details" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE },
    );

    return res.status(200).json({
      status: "success",
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName || "" },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Internal server error` });
  }
};

export const updateUser = async (req, res) => {
  const { userId } = req.params;
  const { fullName, email, password, role } = req.body;

  try {
    const dataToUpdate = {};

    if (fullName) dataToUpdate.fullName = fullName;
    if (email) dataToUpdate.email = email;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      dataToUpdate.password = hashedPassword;
    }

    // Only allow role change if requester is ADMIN
    if (role && req.user?.role === "ADMIN") {
      dataToUpdate.role = role;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update User error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, fullName: true, email: true },
    });

    if (!user) {
      return res.json({ message: "If the email exists, an OTP has been sent" });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP + expiry to user (add these fields to schema!)
    // model User { otp String?  otpExpires DateTime? }
    await prisma.user.update({
      where: { email },
      data: { otp, otpExpires },
    });

    await sendBrevoMail({
      email: user.email,
      subject: "RESET PASSWORD",
      body: setPassword({
        otp,
        name: user.fullName || "User",
        title: "RESET PASSWORD",
      }),
    });

    // if (!emailResult.success) {
    //   console.error("Email send failed:", emailResult.error);
    // }

    return res.json({
      success: true,
      message: "OTP sent to your email",
      userId: user.id,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyOtp = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({
      success: false,
      message: "User ID and OTP are required",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        otp: true,
        otpExpires: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2. Check if OTP was even requested
    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: "No OTP request found or already used",
      });
    }

    // 3. Validate OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // 4. Check expiration
    if (new Date(user.otpExpires) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // 5. OTP is valid → clear OTP fields & generate auth token
    await prisma.user.update({
      where: { id: userId },
      data: {
        otp: null,
        otpExpires: null,
      },
    });

    // 6. Issue JWT for full session
    // const token = jwt.sign(
    //   {
    //     id: user.id,
    //     email: user.email,
    //     role: user.role,
    //   },
    //   process.env.JWT_SECRET,
    //   { expiresIn: process.env.JWT_EXPIRE },
    // );

    const safeUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName || "",
      role: user.role,
    };

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during verification",
    });
  }
};

// RESET PASSWORD (after OTP verification)
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res
      .status(400)
      .json({ message: "Email, OTP and new password required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.otp || !user.otpExpires) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (user.otp !== otp || new Date() > user.otpExpires) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpires: null,
      },
    });

    res.json({ message: "Password reset successfully. Please login." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during password reset" });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Bonus: Save Personality Check Answers (called after frontend quiz)
export const savePersonalityCheck = async (req, res) => {
  const userId = req.user.id; // from JWT middleware
  const answers = req.body; // { q1: "...", q2: "...", ... }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        personalityProfile: answers,
        personalityCompleted: true,
      },
    });

    res.json({ message: "Personality profile saved" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving profile" });
  }
};
