import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './RegisterForm.css';

const DEPARTMENTS = [
  'Разработка',
  'HR и подбор персонала',
  'Маркетинг',
  'Продажи',
  'Финансы и бухгалтерия',
  'Поддержка клиентов',
  'Аналитика и данные',
  'Управление и администрация',
];

export default function RegisterEmployee() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    position: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(
        formData.email,
        formData.password,
        formData.name,
        'employee',
        formData.department,
        formData.position
      );

      // После регистрации отправляем в профиль:
      navigate('/app/profile');
      // Если нужно на дашборд — замени на:
      // navigate('/app/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-form-page">
      <div className="register-form-card">
        <h1 className="form-title">Регистрация Сотрудника</h1>

        <form onSubmit={handleSubmit} className="register-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>ФИО</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Иванов Иван Иванович"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="employee@company.com"
            />
          </div>

          <div className="form-group">
            <label>Подразделение</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              required
            >
              <option value="">Выберите подразделение</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Должность</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              required
              placeholder="Frontend Developer"
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

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Загрузка...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="form-footer">
          <button className="btn-link" onClick={() => navigate('/register')} type="button">
            Назад к выбору роли
          </button>
        </div>
      </div>
    </div>
  );
}
