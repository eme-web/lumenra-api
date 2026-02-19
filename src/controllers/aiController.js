import { aiSearch, aiChat } from "../services/aiService.js";

/**
 * POST /api/ai/search
 * Body: { query }
 */
export async function handleAiSearch(req, res) {
  try {
    const { query } = req.body;
    const response = await aiSearch(query);
    return res.status(200).json({ success: true, data: response });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/ai/chat
 * Body: { message, sessionId? }
 */
export async function handleAiChat(req, res) {
  try {
    const userId = req.user.id;
    const { sessionId, message } = req.body;
    const result = await aiChat(userId, sessionId, message);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
