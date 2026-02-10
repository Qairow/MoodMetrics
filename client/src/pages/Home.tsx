import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User } from 'lucide-react';
import './Home.css';
import logo from '../assets/moodmetricslogo.jpg';
export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="home-page">
      <div className="home-content">
        <div className="home-logo">
         <div className="logo-square">
           <img src={logo} alt="MoodMetrics" className="logo-img" />
          </div>
          <div>
            <div className="logo-title">MoodMetrics</div>
            <div className="logo-subtitle">HR wellbeing dashboard</div>
          </div>
        </div>
        <h1 className="home-title">Мониторинг психологического состояния сотрудников</h1>
        <p className="home-description">
          Современная платформа для HR-отдела по отслеживанию благополучия сотрудников
        </p>
        <div className="home-actions">
          {user ? (
            <button className="btn-profile" onClick={() => navigate('/app/profile')}>
              <User size={20} />
              Профиль
            </button>
          ) : (
            <>
              <button className="btn-signin" onClick={() => navigate('/login')}>
                Войти
              </button>
              <button className="btn-register" onClick={() => navigate('/register')}>
                Регистрация
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
