import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Flame,
  User,
  Bell,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import './Sidebar.css';
import SidebarProfile from './SidebarProfile';

import { useAuth } from '../context/AuthContext';
import logo from '../assets/moodmetricslogo.jpg';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Берём роль из реального пользователя (если вдруг user=null, считаем employee)
  const role: Role = (user?.role as Role) ?? 'employee';

  const menuItems = [
    { path: '/app/dashboard', label: 'Дашборд', icon: LayoutDashboard },
    { path: '/app/surveys', label: 'Опросы', icon: ClipboardList },
    { path: '/app/zones', label: 'Зоны', icon: Flame },
    { path: '/app/employee', label: 'Сотрудник', icon: User },
    { path: '/app/notifications', label: 'Уведомл.', icon: Bell },
    { path: '/app/settings', label: 'Настройки', icon: Settings },
    { path: '/app/admin/users', label: 'Пользователи', icon: User }

  ];

  const go = (path: string) => {
    navigate(path);
    onClose(); // на мобилке закрываем после перехода
  };

  const onLogout = () => {
    logout();       // ✅ реально выходим
    navigate('/');  // ✅ на логин/главную
    onClose();
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'show' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-square">
  <img src={logo} alt="MoodMetrics" className="logo-img" />
 </div>

            <div>
              <div className="logo-title">MoodMetrics</div>
              <div className="logo-subtitle">HR wellbeing dashboard</div>
            </div>
          </div>

          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Закрыть меню"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;

            return (
              <button
                key={item.path}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => go(item.path)}
                type="button"
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="anonymity-card">
            <div className="anonymity-header">
              <span>Анонимность</span>
              <span className="toggle-on">ON</span>
            </div>

            <div className="anonymity-text">порог: ≥ 7 ответов</div>
            <div className="anonymity-text">
              Показываем только агрегаты — без персональных ответов.
            </div>
          </div>

          {/* ✅ Одна кнопка профиля, текст/иконка по роли, путь /app/profile */}
          <SidebarProfile onLogout={onClose} />

        </div>
      </aside>
    </>
  );
}
