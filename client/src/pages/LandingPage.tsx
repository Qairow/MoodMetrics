import { useNavigate } from 'react-router-dom';
import logo from '../assets/moodmetricslogo.jpg';
import './LandingPage.css';

const FEATURES = [
  { icon: '📊', title: 'Дашборд',          desc: 'Индексы благополучия по отделам в реальном времени' },
  { icon: '📝', title: 'Пульс-опросы',     desc: 'Шаблоны вопросов и гибкая периодичность' },
  { icon: '🔥', title: 'Проблемные зоны',  desc: 'Heatmap — сразу видно где нужна помощь' },
  { icon: '🤖', title: 'AI консультант',   desc: 'Психологическая поддержка сотрудников 24/7' },
  { icon: '🔔', title: 'Уведомления',      desc: 'Автосигналы при ухудшении показателей' },
  { icon: '🔒', title: 'Анонимность',      desc: 'Ответы защищены — сотрудники говорят честно' },
];

const ROLES = [
  { icon: '👨‍💼', name: 'Admin',         desc: 'Полный доступ и управление' },
  { icon: '👩‍💼', name: 'HR',            desc: 'Создание опросов и аналитика' },
  { icon: '🧑‍💻', name: 'Руководитель',  desc: 'Данные своего отдела' },
  { icon: '👤',  name: 'Сотрудник',      desc: 'Опросы и личная динамика' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="land">

      {/* ── Навигация ──────────────────────────────────────── */}
      <header className="land__nav">
        <div className="land__logo">
          <div className="land__logo-img">
            <img src={logo} alt="MoodMetrics" />
          </div>
          <div>
            <div className="land__logo-title">MoodMetrics</div>
            <div className="land__logo-sub">HR wellbeing dashboard</div>
          </div>
        </div>
        <div className="land__nav-btns">
          <button className="land__btn-ghost" onClick={() => navigate('/login')}>
            Войти
          </button>
          <button className="land__btn-purple" onClick={() => navigate('/register')}>
            Регистрация
          </button>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="land__hero">
        <div className="land__badge">✅ HR Wellbeing Dashboard</div>
        <h1 className="land__hero-title">
          Мониторинг состояния<br />
          <span className="land__hero-accent">вашей команды</span>
        </h1>
        <p className="land__hero-sub">
          Отслеживайте психологическое благополучие сотрудников в реальном времени.
          Видьте проблему до того, как она стала увольнением.
        </p>
        <div className="land__hero-btns">
          <button className="land__cta-purple" onClick={() => navigate('/login')}>
            Начать работу →
          </button>
          <button className="land__cta-outline" onClick={() => {
            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            Подробнее
          </button>
        </div>
      </section>

      {/* ── Статистика ──────────────────────────────────────── */}
      <div className="land__stats">
        <div className="land__stat">
          <span className="land__stat-num">4<em>+</em></span>
          <span className="land__stat-label">Роли пользователей</span>
        </div>
        <div className="land__stat">
          <span className="land__stat-num">100<em>%</em></span>
          <span className="land__stat-label">Анонимность</span>
        </div>
        <div className="land__stat">
          <span className="land__stat-num">AI</span>
          <span className="land__stat-label">Консультант 24/7</span>
        </div>
      </div>

      {/* ── Возможности ─────────────────────────────────────── */}
      <section className="land__section" id="features">
        <div className="land__section-head">
          <h2>Возможности</h2>
          <p>Всё что нужно HR для работы с благополучием</p>
        </div>
        <div className="land__features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="land__feat-card">
              <div className="land__feat-icon">{f.icon}</div>
              <h3 className="land__feat-title">{f.title}</h3>
              <p className="land__feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Роли ────────────────────────────────────────────── */}
      <section className="land__section land__section--alt">
        <div className="land__section-head">
          <h2>Роли в системе</h2>
          <p>Каждый видит только нужное</p>
        </div>
        <div className="land__roles-grid">
          {ROLES.map((r) => (
            <div key={r.name} className="land__role-card">
              <span className="land__role-icon">{r.icon}</span>
              <strong className="land__role-name">{r.name}</strong>
              <p className="land__role-desc">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="land__cta-box">
        <h2>Готовы начать?</h2>
        <p>Войдите в систему и начните мониторинг прямо сейчас</p>
        <button className="land__cta-purple" onClick={() => navigate('/login')}>
          Войти в MoodMetrics →
        </button>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="land__footer">
        <div className="land__logo">
          <div className="land__logo-img">
            <img src={logo} alt="MoodMetrics" />
          </div>
          <div>
            <div className="land__logo-title">MoodMetrics</div>
            <div className="land__logo-sub">HR wellbeing dashboard</div>
          </div>
        </div>
        <span className="land__footer-copy">© 2025 moodmetrics.kz</span>
      </footer>
    </div>
  );
}