import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';
import logo from '../assets/moodmetricslogo.jpg';
import {API} from "../api"


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

     if (!API) {
      setError("VITE_API_URL не задан в Vercel (Environment Variables).");
      return;
    }

    try {
      await login(email, password);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
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
        <form onSubmit={handleSubmit} className="login-form">
          <h2>Вход</h2>
          {error && <div className="error">{error}</div>}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@psycheck.com"
            />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="admin123"
            />
          </div>
          <button type="submit" className="btn-primary">
            Войти
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
