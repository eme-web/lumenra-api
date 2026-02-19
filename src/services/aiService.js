import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";
import prisma from "../config/db.js"; // your Prisma client

const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 1. Search Query
 *    - Uses a single-shot prompt
 */
export async function aiSearch(query) {
  // Safety filter
  if (!query || query.trim().length < 1) {
    throw new Error("Query cannot be empty");
  }

  const systemMessage = `
You are a supportive trauma-informed educational assistant.
Provide compassionate, evidence-based educational responses.
Do not give clinical or legal advice.
Use clear, concise language.
`;

  const completion = await client.chat.completions.create({
    model: process.env.AI_MODEL,
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: query },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  return completion.choices[0].message.content;
}

/**
 * 2. Chat Conversation
 *    - Uses session memory
 */
export async function aiChat(userId, sessionId, message) {
  // Fetch session history
  let msgs = [];

  if (sessionId) {
    const sessionDB = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (sessionDB) {
      msgs = sessionDB.messages.map((m) => ({
        role: m.role.toLowerCase(),
        content: m.content,
      }));
    }
  }

  // Add new user message
  msgs.push({ role: "user", content: message });

  const systemMessage = `
You are a trauma-informed supportive educational assistant.
Answer gently, avoid clinical advice. Use evidence where possible.
`;

  // Build final messages
  const prompt = [{ role: "system", content: systemMessage }, ...msgs];

  const completion = await client.chat.completions.create({
    model: process.env.AI_MODEL,
    messages: prompt,
    temperature: 0.7,
    max_tokens: 700,
  });

  const assistantMsg = completion.choices[0].message.content;

  // Save to DB (optional)
  let session;

  if (!sessionId) {
    // create new chat session
    session = await prisma.chatSession.create({
      data: {
        user: {
          connect: { id: userId },
        },
        messages: {
          create: [
            { role: "USER", content: message },
            { role: "ASSISTANT", content: assistantMsg },
          ],
        },
      },
    });
  } else {
    // append to existing
    session = await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        messages: {
          create: [
            { role: "USER", content: message },
            { role: "ASSISTANT", content: assistantMsg },
          ],
        },
      },
    });
  }

  return {
    sessionId: session.id,
    assistant: assistantMsg,
  };
}
