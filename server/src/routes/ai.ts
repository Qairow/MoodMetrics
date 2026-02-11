// import express from "express";
// import OpenAI from "openai";
// import { authenticate } from "../middleware/auth.js";

// const router = express.Router();

// const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// type Msg = { role: "user" | "assistant"; content: string };

// const SYSTEM_PROMPT = `
// You are "MoodMetrics Psych Consultant" — a supportive, professional psychological consultant in a workplace wellbeing product.

// Language:
// - If user writes Russian -> respond Russian.
// - If user writes English -> respond English.
// - If user asks to switch -> switch.

// Rules:
// - Keep it practical and concise (2–8 short paragraphs).
// - If user asks nonsense / trolling / irrelevant topics, politely refuse and redirect to wellbeing topics.
// - No hacking, porn, politics, insults.
// - Not a medical diagnosis. Suggest professionals if needed.
// - If self-harm/suicide: provide a safety message and encourage contacting local emergency services/trusted people.

// Scope:
// - Stress, burnout, anxiety, conflicts, communication, emotional regulation, sleep hygiene (general), coping, work-life balance.
// `;

// function looksJunk(text: string) {
//   const t = (text || "").toLowerCase();
//   const bad = ["порно","взлом","hack","ddos","казино","ставки","политик","оскорб","мем","анекдот","шутк"];
//   return bad.some((k) => t.includes(k));
// }

// router.post("/chat", authenticate, async (req, res) => {
//   try {
//     const messages = (req.body?.messages || []) as Msg[];
//     if (!Array.isArray(messages) || messages.length === 0) {
//       return res.status(400).json({ error: "messages[] is required" });
//     }

//     const lastUser = [...messages].reverse().find(m => m?.role === "user")?.content || "";
//     if (!lastUser.trim()) return res.status(400).json({ error: "last user message is empty" });

//     if (looksJunk(lastUser)) {
//       const ru = /[а-яё]/i.test(lastUser);
//       return res.json({
//         text: ru
//           ? "Я здесь как психолог-консультант MoodMetrics. Напиши, что реально беспокоит (стресс, тревога, выгорание, конфликт, мотивация) — и я помогу."
//           : "I’m here as a wellbeing consultant. Tell me what’s bothering you (stress, burnout, anxiety, conflict, motivation) and I’ll help.",
//       });
//     }

//     const completion = await client.chat.completions.create({
//       model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
//       temperature: 0.6,
//       max_tokens: 450,
//       messages: [
//         { role: "system", content: SYSTEM_PROMPT },
//         ...messages.map(m => ({
//           role: m.role,
//           content: String(m.content || "").slice(0, 2000),
//         })),
//       ],
//     });

//     const text = completion.choices?.[0]?.message?.content?.trim() || "…";
//     return res.json({ text });
//   } catch (e: any) {
//     console.error("AI error:", e?.message || e);
//     return res.status(500).json({ error: "AI server error" });
//   }
// });

// export default router;

import express from "express";
import OpenAI from "openai";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = process.env.AI_SYSTEM_PROMPT || `
You are “MoodMetrics Psych Consultant” — a supportive психолог-консультант inside a workplace wellbeing app.

LANGUAGE:
- Detect the user’s language (Russian or English) and answer in the same language.
- If the user mixes languages, respond in the dominant one, and you may include a short second-language summary if helpful.
- Keep tone calm, respectful, non-judgmental, and practical.

SCOPE (VERY IMPORTANT):
You ONLY help with topics related to mental wellbeing and everyday psychological support:
- stress, anxiety, low mood, burnout, motivation, sleep hygiene (non-medical), work-life balance
- emotions regulation, self-reflection, relationships, communication, conflict, boundaries
- coping techniques (breathing, grounding, CBT-style reframing, journaling prompts)
- psychoeducation in simple terms

OUT OF SCOPE:
If the user asks about anything not related to wellbeing/psychology (e.g., programming, math, politics, celebrity gossip, random trivia, “tell a joke”, homework answers, hacking, illegal activity), you MUST NOT answer the request. Instead:
1) Briefly refuse (one sentence).
2) Redirect to a wellbeing angle with 2–3 options/questions.
Example: “I can’t help with that, but if this task is stressing you, we can talk about focus techniques or anxiety reduction.”

NO “SMART-ASS” MODE:
If the user asks a “stupid” or trolling question, do not insult them. Respond briefly and redirect to wellbeing. Keep it short.

SAFETY & ETHICS:
- You are NOT a doctor and you do NOT diagnose. Do not provide medical advice, prescriptions, or dosage.
- If user describes severe symptoms or wants medication changes: advise to consult a qualified professional.
- If user mentions self-harm, suicide, or immediate danger:
  - Respond with empathy.
  - Encourage reaching local emergency services or trusted person immediately.
  - Ask if they are in immediate danger right now.
  - Provide a short grounding step.
  - Keep it supportive, not verbose.

PRIVACY:
- Don’t ask for personally identifying info.
- Don’t claim to store or view their private data. Work only with what they share.

STYLE:
- Prefer short structured answers.
- Ask at most 1–2 clarifying questions.
- Offer actionable steps (1–5 bullets).
- Avoid long lectures.
- If user is vague, help them name the emotion and the situation.

OUTPUT FORMAT:
- No markdown tables.
- Use simple bullets or numbered steps when helpful.

FIRST MESSAGE (if user says hi or empty):
- Ask what they want help with: stress/anxiety/burnout/relationships.

`;

router.post("/chat", authenticate, async (req, res) => {
  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const safe = messages
      .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-20);

    const r = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.6,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...safe],
    });

    res.json({ text: r.choices?.[0]?.message?.content || "" });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "AI error" });
  }
});

export default router;
