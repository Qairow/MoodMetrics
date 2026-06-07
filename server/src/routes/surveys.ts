import { Router } from "express";
import OpenAI from "openai";
import { prisma } from "../prisma.js";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth.js";

const router = Router();

// ── AI generation helpers ─────────────────────────────────────────────────────

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SURVEY_SYSTEM_PROMPT = `Ты — эксперт по HR-психологии и корпоративному благополучию.
Создай профессиональный шаблон опроса на основе описания пользователя.
Возвращай ТОЛЬКО валидный JSON без markdown и без блоков кода:
{
  "name": "Название опроса",
  "description": "Краткое описание (1-2 предложения)",
  "category": "stress|burnout|engagement|wellbeing|team_culture|onboarding",
  "duration_minutes": 5,
  "questions": [
    { "id": 1, "text": "Текст вопроса на русском", "type": "scale|yesno|text", "required": true }
  ]
}
Требования: ровно 10 вопросов, профессиональный язык, вопросы на русском.
Распределение типов: 6-7 вопросов "scale" (шкала 1-5), 2 вопроса "yesno", 1-2 вопроса "text" (открытые).`;

interface GenRecord { id: string; prompt: string; name: string; createdAt: string; }
interface GenData { count: number; resetAt: number; history: GenRecord[]; }

const userGenMap = new Map<string, GenData>();
const DAILY_LIMIT = 5;

function getGenData(userId: string): GenData {
  const now = Date.now();
  const existing = userGenMap.get(userId);
  if (!existing || existing.resetAt < now) {
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const fresh: GenData = { count: 0, resetAt: midnight.getTime(), history: [] };
    userGenMap.set(userId, fresh);
    return fresh;
  }
  return existing;
}

function toSurveyRow(s: any) {
  return {
    id: s.id,
    name: s.name,
    departments: s.departments ?? [],
    status: s.status,
    anonymityThreshold: s.anonymityThreshold,
    createdAt: s.createdAt,
    templateName: s.template?.name,
    archived: s.archived,
  };
}

/**
 * GET /api/surveys
 * список опросов (все роли после логина)
 * важно: твой фронт сам делит на active/archived
 */
router.get("/", authenticate, async (_req, res) => {
  const surveys = await prisma.survey.findMany({
    include: { template: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(surveys.map(toSurveyRow));
});

/**
 * GET /api/surveys/templates
 */
router.get("/templates", authenticate, async (_req, res) => {
  const templates = await prisma.surveyTemplate.findMany({
    include: { questions: true },
    orderBy: { createdAt: "desc" },
  });

  // схема для твоего фронта SurveyCreate.tsx
  res.json(
    templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: undefined,
      questions: (t.questions ?? []).map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
      })),
    }))
  );
});

/**
 * POST /api/surveys
 * создать опрос (HR/Manager/Admin)
 */
router.post("/", authenticate, requireRole("admin", "hr", "manager"), async (req, res) => {
  const { name, templateId, periodicity, anonymityThreshold, departments } = req.body ?? {};

  if (!name || !templateId || !periodicity || !Array.isArray(departments) || departments.length === 0) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const tpl = await prisma.surveyTemplate.findUnique({ where: { id: templateId } });
  if (!tpl) return res.status(404).json({ error: "Template not found" });

  const created = await prisma.survey.create({
    data: {
      name,
      templateId,
      periodicity,
      anonymityThreshold: Number(anonymityThreshold || 7),
      departments,
      status: "active",
      archived: false,
    },
  });

  res.status(201).json({ id: created.id });
});

/**
 * GET /api/surveys/:id
 * детали + вопросы шаблона
 */
router.get("/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      template: { include: { questions: true } },
    },
  });

  if (!survey) return res.status(404).json({ error: "Survey not found" });

  res.json({
    id: survey.id,
    name: survey.name,
    departments: survey.departments,
    periodicity: survey.periodicity,
    anonymityThreshold: survey.anonymityThreshold,
    status: survey.status,
    archived: survey.archived,
    template: {
      id: survey.template.id,
      name: survey.template.name,
      questions: survey.template.questions.map((q) => ({ id: q.id, text: q.text, type: q.type })),
    },
  });
});

/**
 * POST /api/surveys/:id/responses
 * отправка ответов (любой залогиненный пользователь)
 * answers: [{questionId,value}]
 */
router.post("/:id/responses", authenticate, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.userId;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: { template: { include: { questions: true } } },
  });
  if (!survey) return res.status(404).json({ error: "Survey not found" });

  // запрещаем ответы на архивный/закрытый (можешь убрать, если не надо)
  if (survey.archived || survey.status === "closed") {
    return res.status(400).json({ error: "Survey is closed" });
  }

  const answers = req.body?.answers;
  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: "Answers required" });
  }

  const qids = new Set(survey.template.questions.map((q) => q.id));
  for (const a of answers) {
    if (!a?.questionId || typeof a?.value !== "number") return res.status(400).json({ error: "Bad answers format" });
    if (!qids.has(a.questionId)) return res.status(400).json({ error: "Invalid questionId" });
    if (a.value < 1 || a.value > 5) return res.status(400).json({ error: "Value must be 1..5" });
  }

  // проверим approved
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { approved: true } });
  if (!user?.approved) return res.status(403).json({ error: "User is not approved" });

  await prisma.surveyResponse.create({
    data: {
      surveyId: id,
      userId,
      answers,
    },
  });

  res.json({ ok: true });
});

/**
 * PATCH /api/surveys/:id/archive
 * HR/Manager/Admin
 */
router.patch("/:id/archive", authenticate, requireRole("admin", "hr", "manager"), async (req, res) => {
  const { id } = req.params;

  const exists = await prisma.survey.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ error: "Survey not found" });

  const updated = await prisma.survey.update({
    where: { id },
    data: { archived: true, status: "closed" },
  });

  res.json({ ok: true, id: updated.id, archived: updated.archived });
});

/**
 * PATCH /api/surveys/:id/unarchive
 * HR/Manager/Admin
 */
router.patch("/:id/unarchive", authenticate, requireRole("admin", "hr", "manager"), async (req, res) => {
  const { id } = req.params;

  const exists = await prisma.survey.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ error: "Survey not found" });

  const updated = await prisma.survey.update({
    where: { id },
    data: { archived: false, status: "active" },
  });

  res.json({ ok: true, id: updated.id, archived: updated.archived });
});

/**
 * GET /api/surveys/generations
 * Returns user's generation history + remaining quota for today
 */
router.get("/generations", authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const data = getGenData(userId);
  res.json({ history: data.history, remaining: DAILY_LIMIT - data.count });
});

/**
 * POST /api/surveys/generate
 * AI-powered survey template generation
 * Body: { prompt: string }
 * Rate-limited: 5 per day per user
 */
router.post("/generate", authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { prompt } = req.body ?? {};

  if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
    return res.status(400).json({ error: "Prompt is required (min 3 chars)" });
  }

  const genData = getGenData(userId);
  if (genData.count >= DAILY_LIMIT) {
    const resetAt = new Date(genData.resetAt).toISOString();
    return res.status(429).json({ error: "Daily generation limit reached", limit: DAILY_LIMIT, resetAt });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "AI service not configured" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SURVEY_SYSTEM_PROMPT },
        { role: "user", content: prompt.trim() },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    // Strip markdown code fences if model wraps response
    const jsonStr = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let survey: any;
    try {
      survey = JSON.parse(jsonStr);
    } catch {
      return res.status(422).json({ error: "AI returned malformed JSON, try again" });
    }

    if (!survey?.name || !Array.isArray(survey?.questions)) {
      return res.status(422).json({ error: "AI response missing required fields" });
    }

    // Track generation
    genData.count++;
    const record: GenRecord = {
      id: `gen_${Date.now()}`,
      prompt: prompt.trim(),
      name: survey.name,
      createdAt: new Date().toISOString(),
    };
    genData.history.unshift(record);
    if (genData.history.length > 5) genData.history.pop();

    return res.json({
      survey,
      remaining: DAILY_LIMIT - genData.count,
      history: genData.history,
    });
  } catch (e: any) {
    console.error("OpenAI generate error:", e?.message ?? e);
    return res.status(503).json({ error: "AI service unavailable, try again later" });
  }
});

/**
 * POST /api/surveys/templates
 * Save an AI-generated (or custom) template to the database
 * Body: { name, questions: [{ text, type }] }
 */
router.post("/templates", authenticate, requireRole("admin", "hr", "manager"), async (req, res) => {
  const { name, questions } = req.body ?? {};

  if (!name || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: "name and questions[] are required" });
  }

  const template = await prisma.surveyTemplate.create({
    data: {
      name: String(name).trim(),
      questions: {
        create: questions.map((q: any) => ({
          text: String(q.text ?? "").trim(),
          type: ["scale", "text", "yesno"].includes(q.type) ? q.type : "scale",
        })),
      },
    },
    include: { questions: true },
  });

  res.status(201).json({
    id: template.id,
    name: template.name,
    createdAt: template.createdAt,
    questionCount: template.questions.length,
  });
});

export default router;
