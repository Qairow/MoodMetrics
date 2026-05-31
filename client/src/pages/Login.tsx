import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';
import logo from '../assets/moodmetricslogo.jpg';
import { api } from '../api';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();

  // ── Клиентская валидация ──────────────────────────────────────
  const validate = (): string => {
    if (!email.trim())                          return 'Введите email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Некорректный формат email';
    if (!password)                              return 'Введите пароль';
    if (password.length < 6)                   return 'Пароль должен быть минимум 6 символов';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    if (!api) {
      setError('VITE_API_URL не задан. Проверьте Environment Variables.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <div className="logo-square">
              <img src={logo} alt="MoodMetrics" className="logo-img" />
            </div>
            <div>
              <div className="logo-title">MoodMetrics</div>
              <div className="logo-subtitle">HR wellbeing dashboard</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <h2>Вход</h2>

          {error && <div className="error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@company.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>

          <div className="login-footer">
            <button type="button" className="btn-link" onClick={() => navigate('/register')}>
              Нет аккаунта? Зарегистрироваться
            </button>
            <button type="button" className="btn-link" onClick={() => navigate('/')}>
              На главную
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}