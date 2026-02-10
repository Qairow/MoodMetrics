import './Roles.css';

import adminIcon from '../assets/roles/admin.jpg';
import hrIcon from '../assets/roles/hr.jpg';
import managerIcon from '../assets/roles/manager.jpg';
import employeeIcon from '../assets/roles/employee.jpg';

export default function Roles() {
  return (
    <div className="roles-page">
      <div className="roles-grid">

        <div className="role-card">
          <img src={adminIcon} alt="Admin" className="role-icon" />
          <h3>Admin</h3>
          <p>Полный доступ</p>
        </div>

        <div className="role-card">
          <img src={hrIcon} alt="HR" className="role-icon" />
          <h3>HR</h3>
          <p>Аналитика и опросы</p>
        </div>

        <div className="role-card">
          <img src={managerIcon} alt="Manager" className="role-icon" />
          <h3>Руководитель</h3>
          <p>Состояние команды</p>
        </div>

        <div className="role-card">
          <img src={employeeIcon} alt="Employee" className="role-icon" />
          <h3>Сотрудник</h3>
          <p>Личная динамика</p>
        </div>

      </div>
    </div>
  );
}
