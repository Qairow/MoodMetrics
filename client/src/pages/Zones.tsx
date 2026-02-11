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

export default function Zones() {
  const [zones, setZones] = useState<ZoneCard[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fallback: ZoneCard[] = useMemo(
    () => [
      {
        type: 'green',
        title: 'Зелёная зона',
        subtitle: 'Стабильное состояние, низкие риски',
        count: 4,
      },
      {
        type: 'yellow',
        title: 'Жёлтая зона',
        subtitle: 'Нужен мониторинг: растёт нагрузка/стресс',
        count: 2,
      },
      {
        type: 'red',
        title: 'Красная зона',
        subtitle: 'Высокий риск выгорания: требуется внимание',
        count: 1,
      },
    ],
    []
  );

  useEffect(() => {
    (async () => {
      try {
        /**
         * Если у тебя уже есть API — подстрой URL.
         * Я сделал максимально безопасно: если API нет — покажет fallback.
         */
        const res = await api.get('/api/zones/summary');
        // ожидаемый формат: [{ type, title, subtitle, count }]
        if (Array.isArray(res.data) && res.data.length) {
          setZones(res.data);
        } else {
          setZones(fallback);
        }
      } catch {
        setZones(fallback);
      } finally {
        setLoading(false);
      }
    })();
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

  const Icon = ({ type }: { type: ZoneType }) => {
    if (type === 'green') return <ShieldCheck size={18} />;
    if (type === 'yellow') return <AlertTriangle size={18} />;
    return <Flame size={18} />;
  };

  return (
    <div className="zones-page">
      <div className="zones-head">
        <h1 className="zones-title">Зоны</h1>
        <div className="zones-subtitle">Классификация отделов по уровню риска</div>
      </div>

      {loading && <div className="zones-loading">Загрузка…</div>}

      {!loading && (
        <div className="zones-grid">
          {(zones ?? fallback).map((z) => (
            <div key={z.type} className={getCardClass(z.type)}>
              <div className="zone-top">
                <div className="zone-left">
                  <div className={getIconWrapClass(z.type)}>
                    <Icon type={z.type} />
                  </div>

                  <div className="zone-text">
                    <div className="zone-title">{z.title}</div>
                    <div className="zone-sub">{z.subtitle}</div>
                  </div>
                </div>

                <div className="zone-count">{z.count}</div>
              </div>

              <div className="zone-bottom">
                <button className="zone-btn" type="button">
                  Открыть список
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
