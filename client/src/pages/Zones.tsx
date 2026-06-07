import { useEffect, useMemo, useState } from 'react';
import { api } from "../api";
import { ShieldCheck, AlertTriangle, Flame } from 'lucide-react';
import './Zones.css';

type ZoneType = 'green' | 'yellow' | 'red';

type ZoneCard = {
  type: ZoneType;
  title: string;
  subtitle: string;
  count: number;
};

type ZoneUser = {
  id: string;
  name: string;
  department: string | null;
  role: string;
  position: string | null;
  score: number | null;
  zone: ZoneType;
  responsesCount: number;
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  hr: 'HR',
  manager: 'Менеджер',
  employee: 'Сотрудник',
};

export default function Zones() {
  const [zones, setZones] = useState<ZoneCard[] | null>(null);
  const [users, setUsers] = useState<ZoneUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedZone, setExpandedZone] = useState<ZoneType | null>(null);

  const fallback: ZoneCard[] = useMemo(
    () => [
      { type: 'green', title: 'Зелёная зона', subtitle: 'Стабильное состояние, низкие риски', count: 4 },
      { type: 'yellow', title: 'Жёлтая зона', subtitle: 'Нужен мониторинг: растёт нагрузка/стресс', count: 2 },
      { type: 'red', title: 'Красная зона', subtitle: 'Высокий риск выгорания: требуется внимание', count: 1 },
    ],
    []
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/zones/summary');
        setZones(Array.isArray(res.data) && res.data.length ? res.data : fallback);
      } catch {
        setZones(fallback);
      } finally {
        setLoading(false);
      }
    })();

    api.get('/zones/users')
      .then(r => { if (Array.isArray(r.data)) setUsers(r.data); })
      .catch(() => {});
  }, [fallback]);

  const getCardClass = (type: ZoneType) => {
    if (type === 'green') return 'zone-card zone-green';
    if (type === 'yellow') return 'zone-card zone-yellow';
    return 'zone-card zone-red';
  };

  const getIconWrapClass = (type: ZoneType) => {
    if (type === 'green') return 'zone-icon zone-icon-green';
    if (type === 'yellow') return 'zone-icon zone-icon-yellow';
    return 'zone-icon zone-icon-red';
  };

  const ZoneIcon = ({ type }: { type: ZoneType }) => {
    if (type === 'green') return <ShieldCheck size={18} />;
    if (type === 'yellow') return <AlertTriangle size={18} />;
    return <Flame size={18} />;
  };

  const zoneUsers = (type: ZoneType) => users.filter(u => u.zone === type);
  const toggle = (type: ZoneType) => setExpandedZone(prev => prev === type ? null : type);

  return (
    <div className="zones-page">
      <div className="zones-head">
        <h1 className="zones-title">Зоны</h1>
        <div className="zones-subtitle">Классификация сотрудников по уровню риска</div>
      </div>

      {loading && <div className="zones-loading">Загрузка…</div>}

      {!loading && (
        <div className="zones-grid">
          {(zones ?? fallback).map((z) => {
            const expanded = expandedZone === z.type;
            const list = zoneUsers(z.type);
            return (
              <div key={z.type} className={getCardClass(z.type)}>
                <div className="zone-top">
                  <div className="zone-left">
                    <div className={getIconWrapClass(z.type)}>
                      <ZoneIcon type={z.type} />
                    </div>
                    <div className="zone-text">
                      <div className="zone-title">{z.title}</div>
                      <div className="zone-sub">{z.subtitle}</div>
                    </div>
                  </div>
                  <div className="zone-count">{z.count}</div>
                </div>

                <div className="zone-bottom">
                  <button className="zone-btn" type="button" onClick={() => toggle(z.type)}>
                    {expanded ? '▲ Скрыть список' : '▼ Открыть список'}
                  </button>
                </div>

                {expanded && (
                  <div className="zone-users">
                    {list.length === 0 ? (
                      <div className="zone-users-empty">Нет сотрудников в этой зоне</div>
                    ) : (
                      list.map(u => (
                        <div key={u.id} className="zone-user-row">
                          <div className="zone-user-avatar">{u.name.charAt(0).toUpperCase()}</div>
                          <div className="zone-user-info">
                            <div className="zone-user-name">{u.name}</div>
                            <div className="zone-user-meta">
                              {u.department ?? '—'} · {ROLE_LABELS[u.role] ?? u.role}
                            </div>
                          </div>
                          <div className="zone-user-score-wrap">
                            {u.score !== null ? (
                              <div className={`zone-user-score zone-user-score-${z.type}`}>{u.score}</div>
                            ) : (
                              <div className="zone-user-score-na">—</div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
