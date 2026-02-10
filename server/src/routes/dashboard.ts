// server/src/routes/dashboard.ts
import express from "express";
import { prisma } from "../prisma.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = express.Router();

type Dim = "wellbeing" | "burnout" | "tension";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function avg(nums: number[]) {
  return nums.length ? nums.reduce((s, x) => s + x, 0) / nums.length : 0;
}

// 1..5 -> 0..100
function scaleTo100(avg15: number) {
  return Math.round(clamp(((avg15 - 1) / 4) * 100, 0, 100));
}

function statusFromScore100(score: number): "ok" | "risk" | "critical" {
  if (score >= 70) return "ok";
  if (score >= 55) return "risk";
  return "critical";
}

function statusFromPercent(p: number): "low" | "risk" | "critical" {
  if (p < 20) return "low";
  if (p < 40) return "risk";
  return "critical";
}

// Классифицируем вопрос по тексту (без доп.полей в БД)
function dimFromText(text: string): Dim {
  const t = (text || "").toLowerCase();

const burnoutKeys = [
  "устал", "выгор", "перегруз", "нагруз", "сон", "истощ",
  "переутом", "восстанов", "нет сил", "эмоцион"
];

  const tensionKeys = [
    "конфликт", "напряж", "отношен", "команд", "коммуник", "поддержк",
    "спор", "ссора", "токс", "давлен", "агресс"
  ];

  if (burnoutKeys.some((k) => t.includes(k))) return "burnout";
  if (tensionKeys.some((k) => t.includes(k))) return "tension";
  return "wellbeing";
}

// answers Json у тебя может быть:
// 1) { answers: [{questionId,value}, ...] }  (как в твоем SurveyDetails.tsx)
// 2) [{questionId,value}, ...]
// 3) { [questionId]: value }
function normalizeAnswers(raw: any): Array<{ questionId: string; value: number }> {
  if (!raw) return [];

  // case 1
  if (typeof raw === "object" && Array.isArray(raw.answers)) {
    return raw.answers
      .filter((x: any) => x && x.questionId != null)
      .map((x: any) => ({ questionId: String(x.questionId), value: Number(x.value) }));
  }

  // case 2
  if (Array.isArray(raw)) {
    return raw
      .filter((x) => x && (x as any).questionId != null)
      .map((x: any) => ({ questionId: String(x.questionId), value: Number(x.value) }));
  }

  // case 3
  if (typeof raw === "object") {
    const out: Array<{ questionId: string; value: number }> = [];
    for (const [k, v] of Object.entries(raw)) {
      if (k === "answers") continue;
      const num = Number(v as any);
      if (!Number.isFinite(num)) continue;
      out.push({ questionId: String(k), value: num });
    }
    return out;
  }

  return [];
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

router.get("/metrics", authenticate, requireRole("admin", "hr", "manager"), async (req, res) => {
  try {
    const now = new Date();
    const from = addDays(now, -14);

    const responses = await prisma.surveyResponse.findMany({
      where: { createdAt: { gte: from } },
      select: {
        userId: true,
        answers: true,
        user: { select: { department: true } },
        survey: {
          select: {
            template: {
              select: { questions: { select: { id: true, text: true } } },
            },
          },
        },
      },
    });

    const wellbeingVals: number[] = [];
    const burnoutAll: number[] = [];
    const burnoutHigh: number[] = [];
    const tensionAll: number[] = [];
    const tensionHigh: number[] = [];

    // Собираем вопросники в map questionId->text (по каждому response может быть одинаковый template)
    for (const r of responses) {
      const qMap = new Map<string, string>();
      const qs = r.survey?.template?.questions ?? [];
      for (const q of qs) qMap.set(q.id, q.text);

      const ans = normalizeAnswers(r.answers);
      for (const a of ans) {
        const v = Number(a.value);
        if (!Number.isFinite(v)) continue;

        const text = qMap.get(a.questionId) || "";
        const dim = dimFromText(text);

        if (dim === "wellbeing") wellbeingVals.push(v);
        if (dim === "burnout") {
          burnoutAll.push(v);
          if (v >= 4) burnoutHigh.push(v);
        }
        if (dim === "tension") {
          tensionAll.push(v);
          if (v >= 4) tensionHigh.push(v);
        }
      }
    }

    const wellbeing100 = wellbeingVals.length ? scaleTo100(avg(wellbeingVals)) : 0;
    const burnoutPct = burnoutAll.length ? Math.round((burnoutHigh.length / burnoutAll.length) * 100) : 0;
    const tensionPct = tensionAll.length ? Math.round((tensionHigh.length / tensionAll.length) * 100) : 0;

    const totalEmployees = await prisma.user.count({
      where: { approved: true, role: { in: ["employee", "manager"] } },
    });

    const uniqueRespondents = new Set<string>();
    for (const r of responses) uniqueRespondents.add(r.userId);

    const coveragePct = totalEmployees ? Math.round((uniqueRespondents.size / totalEmployees) * 100) : 0;

    return res.json({
      wellbeingIndex: { overall: wellbeing100, status: statusFromScore100(wellbeing100) },
      burnoutRisk: { value: burnoutPct, status: statusFromPercent(burnoutPct) },
      tensionConflicts: { value: tensionPct, status: statusFromPercent(tensionPct) },
      surveyCoverage: { value: coveragePct, period: "14 дней" },
    });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dynamics", authenticate, requireRole("admin", "hr", "manager"), async (req, res) => {
  try {
    const now = startOfDay(new Date());
    const points: { week: string; value: number }[] = [];

    // 8 недель: 7 нед назад ... текущая
    for (let i = 7; i >= 0; i--) {
      const wStart = startOfDay(addDays(now, -i * 7));
      const wEnd = startOfDay(addDays(wStart, 7));

      const responses = await prisma.surveyResponse.findMany({
        where: { createdAt: { gte: wStart, lt: wEnd } },
        select: {
          answers: true,
          survey: {
            select: {
              template: { select: { questions: { select: { id: true, text: true } } } },
            },
          },
        },
      });

      const wellbeingVals: number[] = [];

      for (const r of responses) {
        const qMap = new Map<string, string>();
        const qs = r.survey?.template?.questions ?? [];
        for (const q of qs) qMap.set(q.id, q.text);

        const ans = normalizeAnswers(r.answers);
        for (const a of ans) {
          const text = qMap.get(a.questionId) || "";
          if (dimFromText(text) !== "wellbeing") continue;
          const v = Number(a.value);
          if (!Number.isFinite(v)) continue;
          wellbeingVals.push(v);
        }
      }

      const value = wellbeingVals.length ? scaleTo100(avg(wellbeingVals)) : 0;
      const label = i === 0 ? "Текущая" : `${8 - i} нед.`;
      points.push({ week: label, value });
    }

    return res.json(points);
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/problem-zones", authenticate, requireRole("admin", "hr", "manager"), async (req, res) => {
  try {
    const now = new Date();
    const from = addDays(now, -14);

    const responses = await prisma.surveyResponse.findMany({
      where: { createdAt: { gte: from } },
      select: {
        answers: true,
        user: { select: { department: true } },
        survey: {
          select: {
            template: { select: { questions: { select: { id: true, text: true } } } },
          },
        },
      },
    });

    // dept -> buckets
    const map = new Map<string, { wellbeing: number[]; burnout: number[]; tension: number[] }>();

    for (const r of responses) {
      const dept = r.user?.department || "Без отдела";
      if (!map.has(dept)) map.set(dept, { wellbeing: [], burnout: [], tension: [] });

      const qMap = new Map<string, string>();
      const qs = r.survey?.template?.questions ?? [];
      for (const q of qs) qMap.set(q.id, q.text);

      const ans = normalizeAnswers(r.answers);
      for (const a of ans) {
        const v = Number(a.value);
        if (!Number.isFinite(v)) continue;

        const text = qMap.get(a.questionId) || "";
        const dim = dimFromText(text);
        map.get(dept)![dim].push(v);
      }
    }

    const zones: Array<{ department: string; factor: string; score: number; status: "ok" | "risk" | "critical" }> = [];

    for (const [dept, v] of map.entries()) {
      const wellbeingScore = v.wellbeing.length ? scaleTo100(avg(v.wellbeing)) : 0;

      const burnoutRisk = v.burnout.length ? (v.burnout.filter((x) => x >= 4).length / v.burnout.length) * 100 : 0;
      const tensionRisk = v.tension.length ? (v.tension.filter((x) => x >= 4).length / v.tension.length) * 100 : 0;

      // общий риск (0..100), больше = хуже
      const totalRisk = Math.round(0.5 * (100 - wellbeingScore) + 0.25 * burnoutRisk + 0.25 * tensionRisk);

      // главный фактор
      let factor = "Благополучие";
      let worst = 100 - wellbeingScore;
      if (burnoutRisk > worst) {
        worst = burnoutRisk;
        factor = "Усталость/выгорание";
      }
      if (tensionRisk > worst) {
        worst = tensionRisk;
        factor = "Конфликты/напряжение";
      }

      const status: "ok" | "risk" | "critical" = totalRisk >= 50 ? "critical" : totalRisk >= 30 ? "risk" : "ok";

      zones.push({
        department: dept,
        factor,
        score: clamp(totalRisk, 0, 100),
        status,
      });
    }

    zones.sort((a, b) => b.score - a.score);
    return res.json(zones.slice(0, 3));
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/recommendations", authenticate, requireRole("admin", "hr", "manager"), async (req, res) => {
  try {
    const now = new Date();
    const from = addDays(now, -14);

    const responses = await prisma.surveyResponse.findMany({
      where: { createdAt: { gte: from } },
      select: {
        answers: true,
        user: { select: { department: true } },
        survey: {
          select: {
            template: { select: { questions: { select: { id: true, text: true } } } },
          },
        },
      },
    });

    const map = new Map<
      string,
      { wellbeing: number[]; burnoutAll: number; burnoutHigh: number; tensionAll: number; tensionHigh: number }
    >();

    for (const r of responses) {
      const dept = r.user?.department || "Без отдела";
      if (!map.has(dept)) map.set(dept, { wellbeing: [], burnoutAll: 0, burnoutHigh: 0, tensionAll: 0, tensionHigh: 0 });

      const qMap = new Map<string, string>();
      const qs = r.survey?.template?.questions ?? [];
      for (const q of qs) qMap.set(q.id, q.text);

      const ans = normalizeAnswers(r.answers);

      for (const a of ans) {
        const v = Number(a.value);
        if (!Number.isFinite(v)) continue;

        const text = qMap.get(a.questionId) || "";
        const dim = dimFromText(text);

        const st = map.get(dept)!;

        if (dim === "wellbeing") st.wellbeing.push(v);

        if (dim === "burnout") {
          st.burnoutAll += 1;
          if (v >= 4) st.burnoutHigh += 1;
        }

        if (dim === "tension") {
          st.tensionAll += 1;
          if (v >= 4) st.tensionHigh += 1;
        }
      }
    }

    const recs: Array<{ department: string; issue: string; action: string; status: string }> = [];

    for (const [dept, st] of map.entries()) {
      const wellbeing100 = st.wellbeing.length ? scaleTo100(avg(st.wellbeing)) : 0;
      const burnoutPct = st.burnoutAll ? Math.round((st.burnoutHigh / st.burnoutAll) * 100) : 0;
      const tensionPct = st.tensionAll ? Math.round((st.tensionHigh / st.tensionAll) * 100) : 0;

      if (burnoutPct >= 30) {
        recs.push({
          department: dept,
          issue: "рост усталости/выгорания",
          action: "Провести 1:1, пересмотреть нагрузку на 7 дней, приоритизировать задачи, добавить время на восстановление.",
          status: burnoutPct >= 45 ? "critical" : "risk",
        });
      }

      if (tensionPct >= 25) {
        recs.push({
          department: dept,
          issue: "напряжение в коммуникации",
          action: "Сделать короткую ретро-сессию: правила коммуникации, распределение ответственности, снять конфликтные точки.",
          status: tensionPct >= 40 ? "critical" : "risk",
        });
      }

      if (wellbeing100 && wellbeing100 < 60) {
        recs.push({
          department: dept,
          issue: "низкий индекс благополучия",
          action: "Проверить причины: сроки/ресурсы/контекст задач. Сформировать 2–3 quick wins на ближайшую неделю.",
          status: wellbeing100 < 50 ? "critical" : "risk",
        });
      }
    }

    recs.sort((a, b) => (a.status === b.status ? 0 : a.status === "critical" ? -1 : 1));
    return res.json(recs.slice(0, 6));
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
