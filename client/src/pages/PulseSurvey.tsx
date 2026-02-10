import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ChevronLeft } from 'lucide-react';
import './PulseSurvey.css';

type Q = {
  id: string;
  text: string;
  hint?: string;
};

export default function PulseSurvey() {
  const navigate = useNavigate();

  const questions: Q[] = useMemo(
    () => [
      { id: 'q1', text: 'Какой у тебя уровень стресса за последние 7 дней?', hint: '1 — почти нет стресса, 5 — очень высокий' },
      { id: 'q2', text: 'Насколько ты чувствуешь усталость/выгорание?', hint: '1 — нет, 5 — очень сильно' },
      { id: 'q3', text: 'Насколько тебе хватает сна и восстановления?' },
      { id: 'q4', text: 'Насколько понятны задачи и приоритеты?' },
      { id: 'q5', text: 'Чувствуешь ли ты поддержку команды/руководителя?' },
      { id: 'q6', text: 'Насколько сбалансирована нагрузка?' },
    ],
    []
  );

  // ответы 1..5
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');

  const setAns = (id: string, value: number) => {
    setAnswers((p) => ({ ...p, [id]: value }));
  };

  const completed = questions.every((q) => typeof answers[q.id] === 'number');

  const onSubmit = () => {
    if (!completed) return;

    // MVP: просто лог. Потом отправим в БД
    console.log('Pulse survey submit:', { answers, comment, at: new Date().toISOString() });

    navigate('/app/employee'); // назад в кабинет
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Пульс-опрос</h1>
          <div className="page-subtitle">Шаблон (Likert 1–5). Ответы сохранятся позже в БД.</div>
        </div>

        <div className="page-actions">
          <button className="btn btn-secondary" type="button" onClick={() => navigate(-1)}>
            <ChevronLeft size={18} />
            Назад
          </button>
          <button className="btn btn-primary" type="button" onClick={onSubmit} disabled={!completed}>
            <Send size={18} />
            Отправить
          </button>
        </div>
      </div>

      <section className="card">
        <div className="survey-list">
          {questions.map((q, idx) => (
            <div className="survey-item" key={q.id}>
              <div className="survey-q">
                <div className="survey-num">{idx + 1}</div>
                <div>
                  <div className="survey-text">{q.text}</div>
                  {q.hint && <div className="survey-hint">{q.hint}</div>}
                </div>
              </div>

              <div className="scale">
                {[1, 2, 3, 4, 5].map((v) => (
                  <label key={v} className={`scale-btn ${answers[q.id] === v ? 'on' : ''}`}>
                    <input
                      type="radio"
                      name={q.id}
                      value={v}
                      checked={answers[q.id] === v}
                      onChange={() => setAns(q.id, v)}
                    />
                    {v}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="survey-comment">
          <div className="field-label">Комментарий (опционально)</div>
          <textarea
            className="area"
            placeholder="Если хочешь — добавь пояснение (без личных данных)."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      </section>
    </div>
  );
}
