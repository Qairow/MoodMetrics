import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Briefcase,
  Building,
  Settings,
  Shield,
  ClipboardList,
  LayoutDashboard,
  Bell,
  Users,
} from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Администратор';
      case 'hr':
        return 'HR';
      case 'manager':
        return 'Руководитель';
      case 'employee':
        return 'Сотрудник';
      default:
        return role;
    }
  };

  const roleMeta = (() => {
    switch (user.role) {
      case 'admin':
        return {
          title: 'Панель администратора',
          desc: 'Управление системой, пользователями и настройками.',
          icon: Shield,
          chips: ['Права: полный доступ', 'Без привязки к отделу'],
          actions: [
            { label: 'Настройки системы', icon: Settings, to: '/app/settings' },
            { label: 'Уведомления', icon: Bell, to: '/app/notifications' },
          ],
        };
      case 'hr':
        return {
          title: 'Панель HR',
          desc: 'Опросы, метрики по отделам и зоны риска.',
          icon: ClipboardList,
          chips: ['Опросы', 'Аналитика', 'Зоны риска'],
          actions: [
            { label: 'Опросы', icon: ClipboardList, to: '/app/surveys' },
            { label: 'Зоны', icon: LayoutDashboard, to: '/app/zones' },
          ],
        };
      case 'manager':
        return {
          title: 'Панель руководителя',
          desc: 'Сводка по команде и мониторинг состояния.',
          icon: Users,
          chips: ['Команда', 'Сводка', 'Уведомления'],
          actions: [
            { label: 'Дашборд', icon: LayoutDashboard, to: '/app/dashboard' },
            { label: 'Команда', icon: Users, to: '/app/employee' },
          ],
        };
      case 'employee':
      default:
        return {
          title: 'Профиль сотрудника',
          desc: 'Прохождение опросов и личные уведомления.',
          icon: User,
          chips: ['Опросы', 'Уведомления'],
          actions: [
            { label: 'Пройти опрос', icon: ClipboardList, to: '/app/surveys' },
            { label: 'Уведомления', icon: Bell, to: '/app/notifications' },
          ],
        };
    }
  })();

  const RoleIcon = roleMeta.icon;

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="profile-hero-top">
          <h1 className="profile-title">Профиль</h1>
          <button className="ghost-btn" onClick={() => navigate('/app/dashboard')} type="button">
            <LayoutDashboard size={18} />
            На дашборд
          </button>
        </div>
        <div className="profile-subtitle">Управляй данными аккаунта и быстрыми действиями</div>
      </div>

      <div className="profile-grid">
        {/* LEFT: main card */}
        <section className="profile-card">
          <div className="profile-head">
            <div className="profile-avatar">
              <User size={44} />
            </div>

            <div className="profile-head-text">
              <div className="profile-name">{user.name}</div>
              <div className="profile-role">
                <span className="profile-role-badge">{getRoleLabel(user.role)}</span>
              </div>
            </div>
          </div>

          <div className="profile-info">
            <div className="info-item">
              <Mail size={18} className="info-icon" />
              <div>
                <div className="info-label">Email</div>
                <div className="info-value">{user.email}</div>
              </div>
            </div>

            {user.department && (
              <div className="info-item">
                <Building size={18} className="info-icon" />
                <div>
                  <div className="info-label">Отдел</div>
                  <div className="info-value">{user.department}</div>
                </div>
              </div>
            )}

            {user.position && (
              <div className="info-item">
                <Briefcase size={18} className="info-icon" />
                <div>
                  <div className="info-label">Должность</div>
                  <div className="info-value">{user.position}</div>
                </div>
              </div>
            )}
          </div>

          <div className="profile-actions">
            <button className="btn-primary" onClick={() => navigate('/app/settings')} type="button">
              <Settings size={18} />
              Настройки
            </button>

            <button className="btn-danger" onClick={handleLogout} type="button">
              Выйти
            </button>
          </div>
        </section>

        {/* RIGHT: role panel */}
        <aside className="role-panel">
          <div className="role-panel-head">
            <div className="role-icon">
              <RoleIcon size={20} />
            </div>
            <div>
              <div className="role-title">{roleMeta.title}</div>
              <div className="role-desc">{roleMeta.desc}</div>
            </div>
          </div>

          <div className="role-chips">
            {roleMeta.chips.map((c) => (
              <span key={c} className="chip">
                {c}
              </span>
            ))}
          </div>

          <div className="quick-actions">
            <div className="quick-title">Быстрые действия</div>

            <div className="quick-grid">
              {roleMeta.actions.map((a) => {
                const AIcon = a.icon;
                return (
                  <button
                    key={a.to}
                    className="quick-card"
                    onClick={() => navigate(a.to)}
                    type="button"
                  >
                    <div className="quick-card-icon">
                      <AIcon size={18} />
                    </div>
                    <div className="quick-card-text">{a.label}</div>
                  </button>
                );
              })}

              {/* универсальное действие */}
              <button
                className="quick-card"
                onClick={() => navigate('/app/notifications')}
                type="button"
              >
                <div className="quick-card-icon">
                  <Bell size={18} />
                </div>
                <div className="quick-card-text">Уведомления</div>
              </button>
            </div>

            <div className="hint">
              Подсказка: если тебя переводят в другой отдел/роль — профиль обновится автоматически.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
