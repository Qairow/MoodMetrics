import { Router } from "express";
import { prisma } from "../prisma.js";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth.js";

const router = Router();

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

export default router;
