import { useEffect, useMemo, useState } from 'react';
import { api } from "../api";
import { Bell, Filter, CheckCircle2 } from 'lucide-react';
import './Notifications.css';

type NotificationType = 'all' | 'survey' | 'system' | 'risk';

type NotificationItem = {
  id: string;
  title: string;
  message?: string;
  type: 'survey' | 'system' | 'risk';
  createdAt: string; // можно "сегодня" / "вчера" / ISO
  isRead?: boolean;
};

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<NotificationType>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((x) => x.type === filter);
  }, [items, filter]);

  const unreadCount = useMemo(() => items.filter((x) => !x.isRead).length, [items]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    try {
      setLoading(true);

      // ✅ пробуем взять с сервера
      // ожидаемый формат: [{id,title,message,type,createdAt,isRead}]
      const res = await api.get('/notifications');
      setItems(res.data);
    } catch (e) {
      // ✅ если API пока нет — показываем демо (как на макете)
      setItems([
        {
          id: 'n1',
          title: 'Напоминание об опросе',
          message: 'Пожалуйста, пройди пульс-опрос.',
          type: 'survey',
          createdAt: 'сегодня',
          isRead: false,
        },
        {
          id: 'n2',
          title: 'Система',
          message: 'Настройки анонимности обновлены.',
          type: 'system',
          createdAt: 'вчера',
          isRead: true,
        },
        {
          id: 'n3',
          title: 'Риск',
          message: 'В одном из отделов вырос риск выгорания.',
          type: 'risk',
          createdAt: '3 дн. назад',
          isRead: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      // если есть сервер — отмечаем там
      await api.post('/api/notifications/mark-read');
    } catch {
      // если сервера нет — просто локально
    }
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
  };

  const onApplyFilter = async () => {
    // Если хочешь реально фильтровать на сервере:
    // const res = await axios.get('/api/notifications', { params: { type: filter } });
    // setItems(res.data);
    // Пока просто фильтруем на клиенте (уже сделано в filtered)
  };

  return (
    <div className="mm-page mm-notifications">
      <div className="mm-header">
        <div>
          <h1 className="mm-title">Уведомления</h1>
          <div className="mm-subtitle">Системные события, опросы и риски</div>
        </div>

        <button className="mm-btn mm-btn-light" type="button" onClick={markAllRead}>
          <CheckCircle2 size={18} />
          Отметить прочитанным
        </button>
      </div>

      <div className="mm-notifications-grid">
        {/* ЛЕВО: Лента */}
        <section className="mm-card mm-feed">
          <div className="mm-card-head">
            <div className="mm-card-head-left">
              <div className="mm-card-icon">
                <Bell size={18} />
              </div>
              <div>
                <div className="mm-card-title">Лента</div>
                <div className="mm-card-desc">Последние события</div>
              </div>
            </div>

            <div className="mm-pill">{items.length}</div>
          </div>

          {loading ? (
            <div className="mm-empty">Загрузка…</div>
          ) : filtered.length === 0 ? (
            <div className="mm-empty">Нет уведомлений по выбранному фильтру.</div>
          ) : (
            <div className="mm-feed-list">
              {filtered.map((n) => (
                <div key={n.id} className={`mm-feed-item ${n.isRead ? 'is-read' : ''}`}>
                  <div className="mm-feed-row">
                    <div className="mm-feed-title">{n.title}</div>
                    <div className="mm-feed-date">{n.createdAt}</div>
                  </div>
                  {n.message ? <div className="mm-feed-text">{n.message}</div> : null}
                </div>
              ))}
            </div>
          )}

          <div className="mm-feed-footer">
            <span className="mm-muted">
              Непрочитанных: <b>{unreadCount}</b>
            </span>
          </div>
        </section>

        {/* ПРАВО: Фильтр */}
        <aside className="mm-card mm-filter">
          <div className="mm-card-head">
            <div className="mm-card-head-left">
              <div className="mm-card-icon">
                <Filter size={18} />
              </div>
              <div>
                <div className="mm-card-title">Фильтр</div>
                <div className="mm-card-desc">Показывать тип уведомлений</div>
              </div>
            </div>
          </div>

          <div className="mm-filter-body">
            <label className="mm-label">Тип</label>
            <select className="mm-select" value={filter} onChange={(e) => setFilter(e.target.value as NotificationType)}>
              <option value="all">Все</option>
              <option value="survey">Опросы</option>
              <option value="system">Система</option>
              <option value="risk">Риск</option>
            </select>

            <button className="mm-btn mm-btn-primary mm-btn-wide" type="button" onClick={onApplyFilter}>
              Применить
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
