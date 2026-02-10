// server/src/routes/ai.ts
import express from "express";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const AI_SYSTEM_PROMPT = process.env.AI_SYSTEM_PROMPT || "";
const AI_MAX_INPUT_CHARS = Number(process.env.AI_MAX_INPUT_CHARS || "12000");

function pickAssistantText(apiJson: any) {
  const output = apiJson?.output;
  if (!Array.isArray(output)) return null;

  for (const item of output) {
    if (item?.type === "message" && item?.role === "assistant") {
      const content = item?.content;
      if (Array.isArray(content)) {
        const txt = content
          .filter((c: any) => c?.type === "output_text" && typeof c?.text === "string")
          .map((c: any) => c.text)
          .join("");
        if (txt) return txt;
      }
    }
  }
  return null;
}

router.post("/chat", authenticate, async (req, res) => {
  try {
    if (!OPENAI_API_KEY) return res.status(500).json({ error: "OPENAI_API_KEY is missing" });

    const { messages } = req.body as {
      messages: { role: "user" | "assistant"; content: string }[];
    };

    const safeMessages = Array.isArray(messages) ? messages : [];
    const trimmed = safeMessages
      .slice(-20)
      .map((m) => ({
        role: m.role,
        content: String(m.content || "").slice(0, 3000),
      }));

    const payload = {
      model: OPENAI_MODEL,
      input: [
        { role: "system", content: AI_SYSTEM_PROMPT },
        ...trimmed,
      ],
    };

    const raw = JSON.stringify(payload);
    if (raw.length > AI_MAX_INPUT_CHARS) {
      return res.status(400).json({ error: "Слишком длинный диалог. Сократи сообщения." });
    }

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: raw,
    });

    const data = await r.json();

    if (!r.ok) {
      const msg = data?.error?.message || "OpenAI error";
      return res.status(500).json({ error: msg });
    }

    const text = pickAssistantText(data) || "";
    return res.json({ text });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
