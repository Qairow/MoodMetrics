import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './RegisterForm.css';

export default function RegisterAdmin() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    adminKey: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Admin key validation (for demo, use "admin2024")
    if (formData.adminKey !== 'admin2024') {
      setError('Неверный Admin Key');
      setLoading(false);
      return;
    }

    try {
      await register(formData.email, formData.password, 'Admin User', 'admin');
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-form-page">
      <div className="register-form-card">
        <h1 className="form-title">Регистрация Admin</h1>
        <form onSubmit={handleSubmit} className="register-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="admin@company.com"
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label>Admin Key</label>
            <input
              type="password"
              value={formData.adminKey}
              onChange={(e) => setFormData({ ...formData, adminKey: e.target.value })}
              required
              placeholder="Введите ключ администратора"
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Загрузка...' : 'Активировать'}
          </button>
        </form>

        <div className="form-footer">
          <button className="btn-link" onClick={() => navigate('/register')}>
            Назад к выбору роли
          </button>
        </div>
      </div>
    </div>
  );
}
