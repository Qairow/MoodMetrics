import express from "express";
import OpenAI from "openai";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Msg = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `
You are "MoodMetrics Psych Consultant" — a supportive, professional psychological consultant in a workplace wellbeing product.

Language:
- If user writes Russian -> respond Russian.
- If user writes English -> respond English.
- If user asks to switch -> switch.

Rules:
- Keep it practical and concise (2–8 short paragraphs).
- If user asks nonsense / trolling / irrelevant topics, politely refuse and redirect to wellbeing topics.
- No hacking, porn, politics, insults.
- Not a medical diagnosis. Suggest professionals if needed.
- If self-harm/suicide: provide a safety message and encourage contacting local emergency services/trusted people.

Scope:
- Stress, burnout, anxiety, conflicts, communication, emotional regulation, sleep hygiene (general), coping, work-life balance.
`;

function looksJunk(text: string) {
  const t = (text || "").toLowerCase();
  const bad = ["порно","взлом","hack","ddos","казино","ставки","политик","оскорб","мем","анекдот","шутк"];
  return bad.some((k) => t.includes(k));
}

router.post("/chat", authenticate, async (req, res) => {
  try {
    const messages = (req.body?.messages || []) as Msg[];
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages[] is required" });
    }

    const lastUser = [...messages].reverse().find(m => m?.role === "user")?.content || "";
    if (!lastUser.trim()) return res.status(400).json({ error: "last user message is empty" });

    if (looksJunk(lastUser)) {
      const ru = /[а-яё]/i.test(lastUser);
      return res.json({
        text: ru
          ? "Я здесь как психолог-консультант MoodMetrics. Напиши, что реально беспокоит (стресс, тревога, выгорание, конфликт, мотивация) — и я помогу."
          : "I’m here as a wellbeing consultant. Tell me what’s bothering you (stress, burnout, anxiety, conflict, motivation) and I’ll help.",
      });
    }

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0.6,
      max_tokens: 450,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map(m => ({
          role: m.role,
          content: String(m.content || "").slice(0, 2000),
        })),
      ],
    });

    const text = completion.choices?.[0]?.message?.content?.trim() || "…";
    return res.json({ text });
  } catch (e: any) {
    console.error("AI error:", e?.message || e);
    return res.status(500).json({ error: "AI server error" });
  }
});

export default router;

