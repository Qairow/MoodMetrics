import express from 'express';
import { prisma } from '../prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ── tiny helpers (mirrors dashboard.ts) ───────────────────────────────────────

function avg(nums: number[]) {
  return nums.length ? nums.reduce((s, x) => s + x, 0) / nums.length : 0;
}

function scaleTo100(avg15: number) {
  return Math.round(Math.max(0, Math.min(100, ((avg15 - 1) / 4) * 100)));
}

function dimFromText(text: string): 'wellbeing' | 'burnout' | 'tension' {
  const t = (text || '').toLowerCase();
  const burnoutKeys = ['устал', 'выгор', 'перегруз', 'нагруз', 'сон', 'истощ', 'переутом', 'восстанов', 'нет сил', 'эмоцион'];
  const tensionKeys = ['конфликт', 'напряж', 'отношен', 'команд', 'коммуник', 'поддержк', 'спор', 'ссора', 'токс', 'давлен', 'агресс'];
  if (burnoutKeys.some(k => t.includes(k))) return 'burnout';
  if (tensionKeys.some(k => t.includes(k))) return 'tension';
  return 'wellbeing';
}

function normalizeAnswers(raw: unknown): Array<{ questionId: string; value: number }> {
  if (!raw) return [];
  if (typeof raw === 'object' && Array.isArray((raw as any).answers)) {
    return (raw as any).answers
      .filter((x: any) => x?.questionId != null)
      .map((x: any) => ({ questionId: String(x.questionId), value: Number(x.value) }));
  }
  if (Array.isArray(raw)) {
    return (raw as any[])
      .filter(x => x?.questionId != null)
      .map((x: any) => ({ questionId: String(x.questionId), value: Number(x.value) }));
  }
  if (typeof raw === 'object') {
    const out: Array<{ questionId: string; value: number }> = [];
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (k === 'answers') continue;
      const num = Number(v);
      if (!Number.isFinite(num)) continue;
      out.push({ questionId: k, value: num });
    }
    return out;
  }
  return [];
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

// ── GET /zones/heatmap (existing mock) ────────────────────────────────────────

router.get('/heatmap', authenticate, (_req, res) => {
  const departments = ['Поддержка', 'Продажи', 'Разработка', 'HR'];
  const factors = ['Стресс', 'Выгорание', 'Удовлетворённость', 'Климат в команде', 'Нагрузка'];

  const heatmap = departments.flatMap(dept =>
    factors.map(factor => {
      let score: number;
      let status: 'ok' | 'risk' | 'critical';

      if (dept === 'Разработка' || dept === 'HR') {
        if (factor === 'Нагрузка') { score = 7; status = 'ok'; }
        else { score = 84 + Math.floor(Math.random() * 3); status = 'critical'; }
      } else if (dept === 'Поддержка') {
        if (factor === 'Нагрузка') { score = 53; status = 'ok'; }
        else { score = 22 + Math.floor(Math.random() * 10); status = 'ok'; }
      } else {
        if (factor === 'Нагрузка') { score = 60; status = 'risk'; }
        else { score = 29 + Math.floor(Math.random() * 10); status = 'ok'; }
      }

      return { department: dept, factor, score, status };
    })
  );

  res.json(heatmap);
});

// ── GET /zones/summary ────────────────────────────────────────────────────────
// Returns: [{ type, title, subtitle, count }]
// Counts departments by their risk zone (ok=green, risk=yellow, critical=red)

router.get('/summary', authenticate, async (_req, res) => {
  try {
    const from = addDays(new Date(), -30);

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

    const deptMap = new Map<string, { wellbeing: number[]; burnout: number[]; tension: number[] }>();

    for (const r of responses) {
      const dept = r.user?.department || 'Без отдела';
      if (!deptMap.has(dept)) deptMap.set(dept, { wellbeing: [], burnout: [], tension: [] });

      const qMap = new Map<string, string>();
      for (const q of r.survey?.template?.questions ?? []) qMap.set(q.id, q.text);

      for (const a of normalizeAnswers(r.answers)) {
        const v = Number(a.value);
        if (!Number.isFinite(v)) continue;
        deptMap.get(dept)![dimFromText(qMap.get(a.questionId) || '')].push(v);
      }
    }

    let green = 0, yellow = 0, red = 0;

    for (const [, v] of deptMap.entries()) {
      const wellbeing = v.wellbeing.length ? scaleTo100(avg(v.wellbeing)) : 70;
      const burnoutRisk = v.burnout.length ? (v.burnout.filter(x => x >= 4).length / v.burnout.length) * 100 : 0;
      const tensionRisk = v.tension.length ? (v.tension.filter(x => x >= 4).length / v.tension.length) * 100 : 0;
      const totalRisk = Math.round(0.5 * (100 - wellbeing) + 0.25 * burnoutRisk + 0.25 * tensionRisk);

      if (totalRisk >= 50) red++;
      else if (totalRisk >= 30) yellow++;
      else green++;
    }

    if (deptMap.size === 0) { green = 4; yellow = 2; red = 1; }

    res.json([
      { type: 'green', title: 'Зелёная зона', subtitle: 'Стабильное состояние, низкие риски', count: green },
      { type: 'yellow', title: 'Жёлтая зона', subtitle: 'Нужен мониторинг: растёт нагрузка/стресс', count: yellow },
      { type: 'red', title: 'Красная зона', subtitle: 'Высокий риск выгорания: требуется внимание', count: red },
    ]);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /zones/users ──────────────────────────────────────────────────────────
// Returns all approved users with their average wellbeing score and zone classification
// Sorted: red → yellow → green, then by score ascending (worst first within zone)

router.get('/users', authenticate, requireRole('admin', 'hr', 'manager'), async (_req, res) => {
  try {
    const from = addDays(new Date(), -30);

    const users = await prisma.user.findMany({
      where: { approved: true },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        role: true,
        position: true,
        surveyResponses: {
          where: { createdAt: { gte: from } },
          select: {
            answers: true,
            survey: {
              select: {
                template: { select: { questions: { select: { id: true, text: true } } } },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const result = users.map(u => {
      const vals: number[] = [];
      for (const r of u.surveyResponses) {
        const qMap = new Map<string, string>();
        for (const q of r.survey?.template?.questions ?? []) qMap.set(q.id, q.text);
        for (const a of normalizeAnswers(r.answers)) {
          const v = Number(a.value);
          if (Number.isFinite(v) && v >= 1 && v <= 5) vals.push(v);
        }
      }

      const score = vals.length ? scaleTo100(avg(vals)) : null;
      const zone: 'green' | 'yellow' | 'red' =
        score === null ? 'green' : score >= 70 ? 'green' : score >= 50 ? 'yellow' : 'red';

      return {
        id: u.id,
        name: u.name,
        department: u.department,
        role: u.role,
        position: u.position,
        score,
        zone,
        responsesCount: u.surveyResponses.length,
      };
    });

    const ORDER: Record<string, number> = { red: 0, yellow: 1, green: 2 };
    result.sort((a, b) => {
      if (ORDER[a.zone] !== ORDER[b.zone]) return ORDER[a.zone] - ORDER[b.zone];
      if (a.score !== null && b.score !== null) return a.score - b.score;
      if (a.score !== null) return -1;
      if (b.score !== null) return 1;
      return 0;
    });

    res.json(result);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
