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

interface FormData {
  name: string;
  email: string;
  department: string;
  position: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  department?: string;
  position?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterEmployee() {
  const navigate    = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    name:            '',
    email:           '',
    department:      '',
    position:        '',
    password:        '',
    confirmPassword: '',
  });

  const [errors, setErrors]   = useState<FormErrors>({});
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  // ── Обновление поля + сброс ошибки поля ───────────────────────
  const handleChange = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      setError('');
    };

  // ── Валидация всей формы ──────────────────────────────────────
  const validate = (): FormErrors => {
    const e: FormErrors = {};

    // ФИО
    const name = formData.name.trim();
    if (!name)                  e.name = 'Введите ФИО';
    else if (name.length < 2)   e.name = 'ФИО слишком короткое';
    else if (name.length > 100) e.name = 'ФИО слишком длинное';
    else if (!/^[a-zA-Zа-яёА-ЯЁ\s\-]+$/.test(name))
                                e.name = 'ФИО должно содержать только буквы';

    // Email
    const email = formData.email.trim();
    if (!email)
      e.email = 'Введите email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = 'Некорректный формат email';

    // Подразделение
    if (!formData.department)
      e.department = 'Выберите подразделение';

    // Должность
    const pos = formData.position.trim();
    if (!pos)              e.position = 'Введите должность';
    else if (pos.length < 2) e.position = 'Должность слишком короткая';
    else if (pos.length > 100) e.position = 'Должность слишком длинная';

    // Пароль
    const pwd = formData.password;
    if (!pwd)
      e.password = 'Введите пароль';
    else if (pwd.length < 6)
      e.password = 'Минимум 6 символов';
    else if (pwd.length > 72)
      e.password = 'Пароль слишком длинный';
    else if (!/[a-zA-Zа-яёА-ЯЁ]/.test(pwd))
      e.password = 'Пароль должен содержать хотя бы одну букву';

    // Подтверждение пароля
    if (!formData.confirmPassword)
      e.confirmPassword = 'Подтвердите пароль';
    else if (formData.password !== formData.confirmPassword)
      e.confirmPassword = 'Пароли не совпадают';

    return e;
  };

  // ── Отправка ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await register(
        formData.email.trim().toLowerCase(),
        formData.password,
        formData.name.trim(),
        'employee',
        formData.department,
        formData.position.trim()
      );
      navigate('/app/profile');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  // ── Отображение силы пароля ───────────────────────────────────
  const getPasswordStrength = () => {
    const pwd = formData.password;
    if (!pwd) return null;
    let score = 0;
    if (pwd.length >= 6)  score++;
    if (pwd.length >= 10) score++;
    if (/[A-ZА-ЯЁ]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd))      score++;
    if (/[^a-zA-Zа-яёА-ЯЁ0-9]/.test(pwd)) score++;

    if (score <= 2) return { label: 'Слабый',    color: '#e24b4a' };
    if (score <= 3) return { label: 'Средний',   color: '#ba7517' };
    return             { label: 'Надёжный',       color: '#1d9e75' };
  };

  const strength = getPasswordStrength();

  return (
    <div className="register-form-page">
      <div className="register-form-card">
        <h1 className="form-title">Регистрация сотрудника</h1>

        <form onSubmit={handleSubmit} className="register-form" noValidate>
          {error && <div className="error-message">{error}</div>}

          {/* ФИО */}
          <div className="form-group">
            <label htmlFor="name">ФИО</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={handleChange('name')}
              placeholder="Иванов Иван Иванович"
              autoComplete="name"
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              placeholder="employee@company.com"
              autoComplete="email"
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          {/* Подразделение */}
          <div className="form-group">
            <label htmlFor="department">Подразделение</label>
            <select
              id="department"
              value={formData.department}
              onChange={handleChange('department')}
            >
              <option value="">Выберите подразделение</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            {errors.department && <span className="field-error">{errors.department}</span>}
          </div>

          {/* Должность */}
          <div className="form-group">
            <label htmlFor="position">Должность</label>
            <input
              id="position"
              type="text"
              value={formData.position}
              onChange={handleChange('position')}
              placeholder="Frontend Developer"
            />
            {errors.position && <span className="field-error">{errors.position}</span>}
          </div>

          {/* Пароль */}
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleChange('password')}
              placeholder="Минимум 6 символов"
              autoComplete="new-password"
            />
            {strength && (
              <span className="field-hint" style={{ color: strength.color }}>
                Надёжность: {strength.label}
              </span>
            )}
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          {/* Подтверждение пароля */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Подтвердите пароль</label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              placeholder="Повторите пароль"
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <span className="field-error">{errors.confirmPassword}</span>
            )}
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