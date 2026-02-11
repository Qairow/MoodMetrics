import { useEffect, useState } from 'react';
import { api } from "../api";
import './AdminUsers.css';


type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'hr' | 'manager' | 'employee';
  approved: boolean;
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const loadUsers = async () => {
    const res = await api.get('/users');
    setUsers(res.data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const approveUser = async (id: string) => {
    await api.put(`/users/${id}/approve`);
    loadUsers();
  };

  const filteredUsers = users.filter((u) => {
    if (filter === 'pending') return !u.approved;
    if (filter === 'approved') return u.approved;
    return true;
  });

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1>Пользователи</h1>
          <p>Подтверждение, роли и доступ к сотрудникам</p>
        </div>

        <div className="users-count">{users.length}</div>
      </div>

      <div className="users-card">
        <div className="users-filters">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            Все
          </button>
          <button
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            Ожидают
          </button>
          <button
            className={filter === 'approved' ? 'active' : ''}
            onClick={() => setFilter('approved')}
          >
            Подтверждены
          </button>

          <button className="refresh" onClick={loadUsers}>
            Обновить
          </button>
        </div>

        <table className="users-table">
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td className="name">{u.name}</td>
                <td className="email">{u.email}</td>

                <td>
                  <span className={`role-badge ${u.role}`}>
                    {u.role}
                  </span>
                </td>

                <td>
                  <span className={`status-badge ${u.approved ? 'approved' : 'pending'}`}>
                    {u.approved ? 'approved' : 'pending'}
                  </span>
                </td>

                <td>
                  {!u.approved && (
                    <button
                      className="approve-btn"
                      onClick={() => approveUser(u.id)}
                    >
                      Подтвердить
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="empty">
            Нет пользователей для отображения
          </div>
        )}
      </div>
    </div>
  );
}
