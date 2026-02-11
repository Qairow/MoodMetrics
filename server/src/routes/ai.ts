// server/src/routes/ai.ts
import express from "express";
import OpenAI from "openai";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = process.env.AI_SYSTEM_PROMPT || `
You are a bilingual psychological support assistant for workplace stress (RU/EN).
Rules:
- Speak the user's language (Russian or English). If mixed, ask which language to use.
- Only answer topics related to mental wellbeing: stress, anxiety, burnout, motivation, conflicts, communication, sleep, self-care, work-life balance.
- If the user asks unrelated, silly, or random questions, refuse briefly and redirect back to wellbeing help.
- Do NOT provide medical diagnosis, prescriptions, or emergency instructions.
- If user mentions self-harm or suicide: urge them to seek immediate professional help and contact local emergency services.
- Be warm, short, practical: ask 1 clarifying question + give 2-4 actionable steps.
`;

router.post("/chat", authenticate, async (req, res) => {
  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    if (!messages.length) return res.status(400).json({ error: "messages required" });

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m: any) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content ?? ""),
        })),
      ],
    });

    const text = completion.choices[0]?.message?.content || "";
    res.json({ text });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "AI error" });
  }
});

export default router;
