import { useEffect, useMemo, useState } from 'react';
import { api } from "../api";
import { Bell, Filter, CheckCircle2 } from 'lucide-react';
import './Notifications.css';
import { safeArray } from "../utils/safe";

type NotificationType = 'all' | 'survey' | 'system' | 'risk';

type NotificationItem = {
  id: string;
  title: string;
  message?: string;
  type: 'survey' | 'system' | 'risk';
  createdAt: string;
  isRead?: boolean;
};

// ─── Форматирование даты ────────────────────────────────────────
function formatDate(dateStr: string): string {
  // если уже человекочитаемое — возвращаем как есть
  if (!dateStr.includes('T') && !dateStr.match(/^\d{4}-/)) return dateStr;

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1)   return 'Только что';
    if (diffMin < 60)  return `${diffMin} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7)  return `${diffDays} дн. назад`;

    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return dateStr;
  }
}

const TYPE_LABELS: Record<string, string> = {
  survey: 'Опрос',
  system: 'Система',
  risk:   'Риск',
};

const TYPE_COLORS: Record<string, string> = {
  survey: 'var(--purple)',
  system: '#3b82f6',
  risk:   'var(--red)',
};

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [items, setItems]     = useState<NotificationItem[]>([]);
  const [filter, setFilter]   = useState<NotificationType>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((x) => x.type === filter);
  }, [items, filter]);

  const unreadCount = useMemo(() => items.filter((x) => !x.isRead).length, [items]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setItems(safeArray(res.data));
    } catch {
      setItems([
        {
          id: 'n1',
          title: 'Напоминание об опросе',
          message: 'Пожалуйста, пройди пульс-опрос.',
          type: 'survey',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          isRead: false,
        },
        {
          id: 'n2',
          title: 'Настройки обновлены',
          message: 'Настройки анонимности успешно сохранены.',
          type: 'system',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          isRead: true,
        },
        {
          id: 'n3',
          title: 'Риск выгорания',
          message: 'В отделе "Поддержка" вырос риск выгорания.',
          type: 'risk',
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          isRead: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try { await api.post('/notifications/mark-read'); } catch { /* игнорируем */ }
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
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
        {/* Лента */}
        <section className="mm-card mm-feed">
          <div className="mm-card-head">
            <div className="mm-card-head-left">
              <div className="mm-card-icon"><Bell size={18} /></div>
              <div>
                <div className="mm-card-title">Лента</div>
                <div className="mm-card-desc">Последние события</div>
              </div>
            </div>
            {unreadCount > 0 && (
              <div className="mm-pill mm-pill-unread">{unreadCount} новых</div>
            )}
          </div>

          {loading ? (
            <div className="mm-empty">Загрузка…</div>
          ) : filtered.length === 0 ? (
            <div className="mm-empty">Нет уведомлений по выбранному фильтру.</div>
          ) : (
            <div className="mm-feed-list">
              {filtered.map((n) => (
                <div key={n.id} className={`mm-feed-item ${n.isRead ? 'is-read' : 'is-unread'}`}>
                  <div className="mm-feed-row">
                    <div className="mm-feed-left">
                      {!n.isRead && <span className="mm-feed-dot" />}
                      <div>
                        <div className="mm-feed-title">{n.title}</div>
                        {n.message && <div className="mm-feed-text">{n.message}</div>}
                      </div>
                    </div>
                    <div className="mm-feed-right">
                      {/* ✅ Тип уведомления */}
                      <span
                        className="mm-feed-type"
                        style={{ color: TYPE_COLORS[n.type] }}
                      >
                        {TYPE_LABELS[n.type]}
                      </span>
                      {/* ✅ Читаемая дата */}
                      <span className="mm-feed-date">{formatDate(n.createdAt)}</span>
                    </div>
                  </div>
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

        {/* Фильтр */}
        <aside className="mm-card mm-filter">
          <div className="mm-card-head">
            <div className="mm-card-head-left">
              <div className="mm-card-icon"><Filter size={18} /></div>
              <div>
                <div className="mm-card-title">Фильтр</div>
                <div className="mm-card-desc">Показывать тип уведомлений</div>
              </div>
            </div>
          </div>
          <div className="mm-filter-body">
            <label className="mm-label">Тип</label>
            <select
              className="mm-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value as NotificationType)}
            >
              <option value="all">Все</option>
              <option value="survey">Опросы</option>
              <option value="system">Система</option>
              <option value="risk">Риск</option>
            </select>
            <button className="mm-btn mm-btn-primary mm-btn-wide" type="button">
              Применить
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}