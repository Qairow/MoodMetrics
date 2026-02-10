import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, Users, Flag, User } from 'lucide-react';
import './RegisterRole.css';
import adminIcon from '../assets/roles/admin.jpg';
import hrIcon from '../assets/roles/hr.jpg';
import managerIcon from '../assets/roles/manager.jpg';
import employeeIcon from '../assets/roles/employee.jpg';

export default function RegisterRole() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await axios.get('/api/employees/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to load departments', error);
    }
  };

 const roles: Array<{
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  departments?: any[];
}> = [
  {
    id: 'admin',
    title: 'Admin',
    description: 'Полный доступ',
    icon: adminIcon,
    route: '/register/admin',
  },
  {
    id: 'hr',
    title: 'HR',
    description: 'Аналитика и опросы',
    icon: hrIcon,
    route: '/register/hr',
  },
  {
    id: 'manager',
    title: 'Руководитель',
    description: `Состояние команды${departments.length > 0 ? ` • ${departments.length} отделов` : ''}`,
    icon: managerIcon,
    route: '/register/manager',
    departments: departments,
  },
  {
    id: 'employee',
    title: 'Сотрудник',
    description: 'Личная динамика',
    icon: employeeIcon,
    route: '/register/employee',
  },
];


  return (
    <div className="register-role-page">
      <div className="register-role-content">
        <h1 className="page-title">Создание аккаунта</h1>
        <p className="page-subtitle">Выберите вашу роль в системе</p>

        <div className="roles-grid">
       {roles.map((role) => {
  return (
    <button
      key={role.id}
      className="role-card"
      onClick={() => navigate(role.route)}
      type="button"
    >
      <img src={role.icon} alt={role.title} className="role-icon-img" />
      <h3 className="role-title">{role.title}</h3>
      <p className="role-description">{role.description}</p>

      {role.id === 'manager' && departments.length > 0 && (
        <div className="departments-preview">
          <div className="departments-list">
            {departments.slice(0, 3).map((dept) => (
              <span key={dept.id} className="dept-badge">
                {dept.name}
              </span>
            ))}
            {departments.length > 3 && (
              <span className="dept-more">+{departments.length - 3}</span>
            )}
          </div>
        </div>
      )}
    </button>
  );
})}

        </div>

        <div className="back-to-home">
          <button className="btn-back" onClick={() => navigate('/')}>
            На главную
          </button>
          <button className="btn-login-link" onClick={() => navigate('/login')}>
            Уже есть аккаунт? Войти
          </button>
        </div>
      </div>
    </div>
  );
}
