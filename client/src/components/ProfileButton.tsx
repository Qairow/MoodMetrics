import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Users, Building2 } from 'lucide-react';

export type Role = 'admin' | 'hr' | 'manager' | 'employee';

type Props = {
  role: Role;
  onAfterClick?: () => void;
};

export default function ProfileButton({ role, onAfterClick }: Props) {
  const navigate = useNavigate();

  // внешний вид зависит от роли, путь один для всех
  const cfg = useMemo(() => {
    switch (role) {
      case 'admin':
        return { label: 'Профиль администратора', Icon: Shield };
      case 'hr':
        return { label: 'Профиль HR', Icon: Users };
      case 'manager':
        return { label: 'Профиль руководителя', Icon: Building2 };
      case 'employee':
      default:
        return { label: 'Мой профиль', Icon: User };
    }
  }, [role]);

  return (
    <button
      className="profile-button"
      type="button"
      onClick={() => {
        navigate('/app/profile');
        onAfterClick?.();
      }}
    >
      <cfg.Icon size={18} />
      {cfg.label}
    </button>
  );
}
