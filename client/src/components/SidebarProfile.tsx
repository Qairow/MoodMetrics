import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './SidebarProfile.css';

type Props = {
  onLogout?: () => void;      // если хочешь закрывать sidebar после выхода
};

const ROLE_CONFIG: Record<
  string,
  { letter: string; title: string; subtitle: string }
> = {
  admin: {
    letter: 'A',
    title: 'Профиль администратора',
    subtitle: 'Администратор',
  },
  hr: {
    letter: 'HR',
    title: 'Профиль HR',
    subtitle: 'HR',
  },
  manager: {
    letter: 'M',
    title: 'Профиль руководителя',
    subtitle: 'Руководитель',
  },
  employee: {
    letter: 'E',
    title: 'Профиль сотрудника',
    subtitle: 'Сотрудник',
  },
};

export default function SidebarProfile({ onLogout }: Props) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const role = user.role || 'employee';
  const roleData = ROLE_CONFIG[role] || ROLE_CONFIG.employee;

  const handleLogout = () => {
    logout();
    onLogout?.();
  };

  return (
    <div className="sidebar-profile">
      <div className="sidebar-profile-card">
        <div className={`sidebar-profile-avatar ${role}`}>
          {roleData.letter}
        </div>

        <div className="sidebar-profile-text">
          <div className="sidebar-profile-title">{roleData.title}</div>
          <div className="sidebar-profile-subtitle">{roleData.subtitle}</div>
        </div>
      </div>

      <button className="sidebar-logout-btn" onClick={handleLogout} type="button">
        <LogOut size={18} />
        Выйти
      </button>
    </div>
  );
}
