import { useEffect, useState } from 'react';
import { api } from "../api";
import { CheckCircle2, RefreshCw } from 'lucide-react';
import './PendingUsers.css';

type PendingUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  position?: string;
  approved?: boolean;
};

export default function PendingUsers() {
  const [list, setList] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await api.get('/api/employees/pending');
      setList(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Не удалось загрузить список');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id: string) => {
    try {
      await api.put(`/api/employees/${id}/approve`);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Не удалось подтвердить');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Подтверждение пользователей</h1>
          <div className="page-subtitle">
            Здесь администратор подтверждает новые аккаунты (employee/manager)
          </div>
        </div>

        <div className="page-actions">
          <button className="btn btn-secondary" type="button" onClick={load} disabled={loading}>
            <RefreshCw size={18} />
            Обновить
          </button>
        </div>
      </div>

      <section className="card">
        {error && <div className="pending-error">{error}</div>}

        {loading ? (
          <div className="page-subtitle">Загрузка...</div>
        ) : list.length === 0 ? (
          <div className="page-subtitle">Нет пользователей, ожидающих подтверждения.</div>
        ) : (
          <div className="table">
            <div className="trow head">
              <div>ФИО</div>
              <div>Email</div>
              <div>Роль</div>
              <div>Отдел</div>
              <div>Действие</div>
            </div>

            {list.map((u) => (
              <div className="trow" key={u.id}>
                <div style={{ fontWeight: 900, color: 'var(--text-primary)' }}>{u.name}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{u.email}</div>
                <div>
                  <span className="badge">{u.role}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>{u.department || '—'}</div>
                <div>
                  <button className="btn btn-primary" type="button" onClick={() => approve(u.id)}>
                    <CheckCircle2 size={18} />
                    Подтвердить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
