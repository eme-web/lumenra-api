import express from "express";
import { handleAiSearch, handleAiChat } from "../controllers/aiController.js";
import authMiddleware from "../middleware/isAuthorized.js";

const router = express.Router();

router.post("/search", handleAiSearch); // /api/ai/search
router.post("/chat", authMiddleware, handleAiChat); // /api/ai/chat

export default router;
