import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ChevronLeft } from 'lucide-react';
import axios from 'axios';
import './SurveyCreate.css';

type Template = {
  id: string;
  name: string;
  description?: string;
  questions: { id: string; text: string; type: string }[];
};

export default function SurveyCreate() {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [name, setName] = useState('Пульс-опрос недели');
  const [periodicity, setPeriodicity] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [threshold, setThreshold] = useState(7);

  const [departments, setDepartments] = useState<string[]>(['Разработка']);
  const [allDepts] = useState<string[]>([
    'Разработка',
    'Маркетинг',
    'Продажи',
    'Поддержка клиентов',
    'Аналитика и данные',
    'HR',
    'Финансы',
    'Операции',
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const t = await axios.get('/api/surveys/templates');
        setTemplates(t.data);
        if (t.data?.length) setTemplateId(t.data[0].id);
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Не удалось загрузить шаблоны опросов');
      }
    })();
  }, []);

  const toggleDept = (d: string) => {
    setDepartments((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const onCreate = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await axios.post('/api/surveys', {
        name,
        templateId,
        periodicity,
        anonymityThreshold: threshold,
        departments,
      });

      // ✅ универсально (чтобы не улетать на /undefined)
      const surveyId = res.data?.id ?? res.data?.survey?.id ?? res.data?.surveyId;
      if (!surveyId) throw new Error('Server did not return survey id');

      navigate(`/app/surveys/${surveyId}`);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Ошибка создания опроса');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page survey-create">
      <div className="page-header">
        <div>
          <h1 className="page-title">Создать опрос</h1>
          <div className="page-subtitle">Выбери шаблон, отделы и порог анонимности</div>
        </div>

        <div className="page-actions">
          <button className="btn btn-secondary" type="button" onClick={() => navigate(-1)}>
            <ChevronLeft size={18} /> Назад
          </button>

          <button
            className="btn btn-primary"
            type="button"
            onClick={onCreate}
            disabled={saving || !templateId || departments.length === 0}
          >
            <Save size={18} />
            {saving ? 'Создаём...' : 'Создать'}
          </button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="survey-grid">
        <section className="card">
          <div className="form-stack">
            <div>
              <div className="field-label">Название</div>
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <div className="field-label">Шаблон</div>
              <select className="field" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="field-label">Периодичность</div>
              <select className="field" value={periodicity} onChange={(e) => setPeriodicity(e.target.value as any)}>
                <option value="daily">Ежедневно</option>
                <option value="weekly">Еженедельно</option>
                <option value="monthly">Ежемесячно</option>
              </select>
            </div>

            <div>
              <div className="field-label">Порог анонимности</div>
              <input
                className="field"
                type="number"
                min={3}
                max={50}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
              />
              <div className="help">
                Совет: для корректной анонимности обычно ставят <b>7+</b> ответов на отдел.
              </div>
            </div>
          </div>
        </section>

        <aside className="card fill">
          <div className="card-head">
            <div>
              <h2 className="card-title">Отделы</h2>
              <div className="card-desc">Кому отправить опрос</div>
            </div>
            <div className="dept-count">{departments.length}</div>
          </div>

          <div className="dept-chips">
            {allDepts.map((d) => (
              <label className="dept-chip" key={d}>
                <input type="checkbox" checked={departments.includes(d)} onChange={() => toggleDept(d)} />
                {d}
              </label>
            ))}
          </div>

          <div className="page-subtitle" style={{ marginTop: 'auto' }}>
            После создания можно сразу пройти опрос и отправить ответы.
          </div>
        </aside>
      </div>
    </div>
  );
}
