import express from "express";
import { prisma } from "../prisma.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/surveys/templates
 * Доступно авторизованным (можешь снять authenticate если хочешь публично)
 */
router.get("/templates", authenticate, async (_req, res) => {
  const templates = await prisma.surveyTemplate.findMany({
    include: { questions: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(templates);
});

/**
 * GET /api/surveys
 * список опросов
 */
router.get("/", authenticate, async (_req, res) => {
  const surveys = await prisma.survey.findMany({
    include: {
      template: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(
    surveys.map((s) => ({
      id: s.id,
      name: s.name,
      departments: s.departments,
      status: s.status,
      archived: s.archived,
      anonymityThreshold: s.anonymityThreshold,
      createdAt: s.createdAt,
      templateName: s.template?.name ?? undefined,
    }))
  );
});

/**
 * POST /api/surveys
 * создавать может HR/Manager (и admin если хочешь)
 */
router.post("/", authenticate, requireRole("hr", "manager", "admin"), async (req, res) => {
  const { name, templateId, periodicity, anonymityThreshold, departments } = req.body;

  if (!name || !templateId || !Array.isArray(departments) || departments.length === 0) {
    return res.status(400).json({ error: "Некорректные данные" });
  }

  const template = await prisma.surveyTemplate.findUnique({ where: { id: templateId } });
  if (!template) return res.status(400).json({ error: "Template not found" });

  const survey = await prisma.survey.create({
    data: {
      name,
      templateId,
      periodicity,
      anonymityThreshold: Number(anonymityThreshold ?? 7),
      departments,
      status: "active",
      archived: false,
    },
  });

  // ✅ ВАЖНО: возвращаем id как res.data.id
  return res.json({ id: survey.id });
});

/**
 * GET /api/surveys/:id
 * открыть опрос + вопросы шаблона
 */
router.get("/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: { template: { include: { questions: true } } },
  });

  if (!survey) return res.status(404).json({ error: "Survey not found" });

  return res.json({
    id: survey.id,
    name: survey.name,
    template: { questions: survey.template.questions },
  });
});

/**
 * POST /api/surveys/:id/responses
 * отправить ответы сотрудником
 */
router.post("/:id/responses", authenticate, async (req, res) => {
  const { id } = req.params;
  const { answers } = req.body as { answers: { questionId: string; value: number }[] };

  const exists = await prisma.survey.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ error: "Survey not found" });

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: "Answers required" });
  }

  // сохраняем как SurveyResponse с JSON
  await prisma.surveyResponse.create({
    data: {
      surveyId: id,
      userId: req.userId!, // из middleware/auth.ts
      answers: answers,     // Json
    },
  });

  return res.json({ ok: true });
});

/**
 * PATCH /api/surveys/:id/archive
 * HR/Manager архивирует
 */
router.patch("/:id/archive", authenticate, requireRole("hr", "manager", "admin"), async (req, res) => {
  const { id } = req.params;

  const survey = await prisma.survey.findUnique({ where: { id } });
  if (!survey) return res.status(404).json({ error: "Survey not found" });

  await prisma.survey.update({
    where: { id },
    data: { archived: true, status: "closed" },
  });

  return res.json({ ok: true });
});

/**
 * PATCH /api/surveys/:id/unarchive
 */
router.patch("/:id/unarchive", authenticate, requireRole("hr", "manager", "admin"), async (req, res) => {
  const { id } = req.params;

  const survey = await prisma.survey.findUnique({ where: { id } });
  if (!survey) return res.status(404).json({ error: "Survey not found" });

  await prisma.survey.update({
    where: { id },
    data: { archived: false, status: "active" },
  });

  return res.json({ ok: true });
});

export default router;
