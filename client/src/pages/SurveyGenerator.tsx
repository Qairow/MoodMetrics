import { useState, useEffect } from 'react';
import { api } from '../api';
import './SurveyGenerator.css';

interface GeneratedQuestion {
  id: number;
  text: string;
  type: 'scale' | 'yesno' | 'text';
  required: boolean;
}

interface GeneratedSurvey {
  name: string;
  description: string;
  category: string;
  duration_minutes: number;
  questions: GeneratedQuestion[];
}

interface GenRecord {
  id: string;
  prompt: string;
  name: string;
  createdAt: string;
}

const TYPE_CFG = {
  scale: { icon: '⭐', label: 'Шкала 1–5', color: '#7c5cff' },
  yesno: { icon: '👍', label: 'Да / Нет',  color: '#10b981' },
  text:  { icon: '📝', label: 'Открытый',  color: '#f59e0b' },
} as const;

const CATEGORY_LABELS: Record<string, string> = {
  stress: 'Стресс', burnout: 'Выгорание', engagement: 'Вовлечённость',
  wellbeing: 'Благополучие', team_culture: 'Командная культура', onboarding: 'Онбординг',
};

const EXAMPLE_PROMPTS = [
  'Опрос про выгорание в команде разработки',
  'Еженедельный пульс-опрос для всех сотрудников',
  'Оценка командного климата после реструктуризации',
  'Опрос удовлетворённости онбордингом новых сотрудников',
];

export default function SurveyGenerator() {
  const [prompt, setPrompt]         = useState('');
  const [loading, setLoading]       = useState(false);
  const [generated, setGenerated]   = useState<GeneratedSurvey | null>(null);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [history, setHistory]       = useState<GenRecord[]>([]);
  const [remaining, setRemaining]   = useState<number | null>(null);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    api.get('/surveys/generations')
      .then(r => {
        setHistory(r.data.history ?? []);
        setRemaining(r.data.remaining ?? null);
      })
      .catch(() => {});
  }, []);

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setGenerated(null);
    setSaved(false);

    try {
      const res = await api.post('/surveys/generate', { prompt: prompt.trim() });
      setGenerated(res.data.survey);
      setRemaining(res.data.remaining);
      setHistory(res.data.history ?? []);
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? 'Ошибка генерации, попробуйте снова';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!generated || saving) return;
    setSaving(true);
    setError(null);
    try {
      await api.post('/surveys/templates', {
        name: generated.name,
        questions: generated.questions.map(q => ({
          text: q.text,
          type: q.type === 'yesno' ? 'yesno' : q.type === 'text' ? 'text' : 'scale',
        })),
      });
      setSaved(true);
    } catch {
      setError('Не удалось сохранить шаблон');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="gen-page">

      {/* ── Hero ── */}
      <div className="gen-hero">
        <div className="gen-hero-left">
          <div className="gen-hero-icon">✨</div>
          <div>
            <h1 className="gen-hero-title">AI Генератор опросов</h1>
            <p className="gen-hero-sub">
              Опишите нужный опрос — ИИ создаст 10 профессиональных вопросов за секунды
            </p>
          </div>
        </div>
        {remaining !== null && (
          <div className="gen-quota">
            <span className="gen-quota-num">{remaining}</span>
            <span className="gen-quota-label">генераций<br />осталось</span>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="gen-layout">

        {/* Left column */}
        <div className="gen-main">

          {/* Prompt card */}
          <div className="gen-card">
            <div className="gen-label">Опишите нужный опрос</div>
            <textarea
              className="gen-textarea"
              placeholder="Например: опрос для оценки уровня выгорания в команде продаж после высокого сезона"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={3}
              disabled={loading}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) generate(); }}
            />

            <div className="gen-chips">
              {EXAMPLE_PROMPTS.map(p => (
                <button key={p} className="gen-chip" type="button" onClick={() => setPrompt(p)}>
                  {p}
                </button>
              ))}
            </div>

            <button
              className={`gen-btn-primary${loading ? ' is-loading' : ''}`}
              onClick={generate}
              disabled={loading || !prompt.trim()}
              type="button"
            >
              {loading
                ? <><span className="gen-dot-spin" />Генерирую…</>
                : <>✨ Сгенерировать</>}
            </button>

            {error && <div className="gen-error">{error}</div>}
          </div>

          {/* Skeleton while loading */}
          {loading && (
            <div className="gen-card gen-skeleton-card">
              <div className="gen-sk gen-sk-title" />
              <div className="gen-sk gen-sk-desc" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="gen-sk-row">
                  <div className="gen-sk gen-sk-icon" />
                  <div className="gen-sk gen-sk-line" />
                </div>
              ))}
            </div>
          )}

          {/* Result */}
          {!loading && generated && (
            <div className="gen-card gen-result">
              <div className="gen-result-top">
                <div className="gen-result-info">
                  <div className="gen-result-name">{generated.name}</div>
                  {generated.description && (
                    <div className="gen-result-desc">{generated.description}</div>
                  )}
                  <div className="gen-tags">
                    {generated.category && (
                      <span className="gen-tag gen-tag-cat">
                        {CATEGORY_LABELS[generated.category] ?? generated.category}
                      </span>
                    )}
                    {generated.duration_minutes > 0 && (
                      <span className="gen-tag">⏱ {generated.duration_minutes} мин</span>
                    )}
                    <span className="gen-tag">📋 {generated.questions.length} вопросов</span>
                  </div>
                </div>
                {saved ? (
                  <div className="gen-saved">✓ Сохранён</div>
                ) : (
                  <button className="gen-btn-save" onClick={save} disabled={saving} type="button">
                    {saving ? 'Сохранение…' : '💾 Сохранить шаблон'}
                  </button>
                )}
              </div>

              <div className="gen-questions">
                {generated.questions.map((q, i) => {
                  const cfg = TYPE_CFG[q.type] ?? TYPE_CFG.scale;
                  return (
                    <div key={q.id ?? i} className="gen-q">
                      <div className="gen-q-num">{i + 1}</div>
                      <div className="gen-q-body">
                        <div className="gen-q-text">{q.text}</div>
                        <div className="gen-q-type" style={{ color: cfg.color }}>
                          {cfg.icon} {cfg.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* History sidebar */}
        {history.length > 0 && (
          <aside className="gen-history">
            <div className="gen-history-title">История генераций</div>
            {history.map((h, i) => (
              <div key={h.id ?? i} className="gen-history-item">
                <div className="gen-history-name">{h.name}</div>
                <div className="gen-history-prompt">{h.prompt}</div>
                <div className="gen-history-date">
                  {new Date(h.createdAt).toLocaleString('ru', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </aside>
        )}
      </div>
    </div>
  );
}
