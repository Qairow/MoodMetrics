import { useEffect, useState } from 'react';
import { api } from "../api";

import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, Plus } from 'lucide-react';
import './Dashboard.css';

interface Metrics {
  wellbeingIndex: { overall: number; status: string };
  burnoutRisk: { value: number; status: string };
  tensionConflicts: { value: number; status: string };
  surveyCoverage: { value: number; period: string };
}

interface ProblemZone {
  department: string;
  factor: string;
  score: number;
  status: 'ok' | 'risk' | 'critical';
}

interface Recommendation {
  department: string;
  issue: string;
  action: string;
  status: string;
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [dynamics, setDynamics] = useState<any[]>([]);
  const [problemZones, setProblemZones] = useState<ProblemZone[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [metricsRes, dynamicsRes, zonesRes, recRes] = await Promise.all([
        api.get('/dashboard/metrics'),
        api.get('/dashboard/dynamics'),
        api.get('/dashboard/problem-zones'),
        api.get('/dashboard/recommendations'),
      ]);

      setMetrics(metricsRes.data);
      setDynamics(dynamicsRes.data);
      setProblemZones(zonesRes.data);
      setRecommendations(recRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data', error);
      // Чтобы не висело "Загрузка..." вечно
      setMetrics({
        wellbeingIndex: { overall: 74, status: 'risk' },
        burnoutRisk: { value: 31, status: 'low' },
        tensionConflicts: { value: 18, status: 'risk' },
        surveyCoverage: { value: 62, period: '14 дней' },
      });
      setDynamics([
        { week: '8 нед.', value: 70 },
        { week: '7 нед.', value: 72 },
        { week: '6 нед.', value: 71 },
        { week: '5 нед.', value: 73 },
        { week: '4 нед.', value: 74 },
        { week: '3 нед.', value: 74 },
        { week: '2 нед.', value: 73 },
        { week: 'Текущая', value: 74 },
      ]);
      setProblemZones([
        { department: 'Продажи', factor: 'Нагрузка/сроки', score: 72, status: 'risk' },
        { department: 'Поддержка', factor: 'Конфликты/напряжение', score: 66, status: 'risk' },
        { department: 'Разработка', factor: 'Усталость/выгорание', score: 58, status: 'ok' },
      ]);
      setRecommendations([
        { department: 'Продажи', issue: 'рост напряжения', action: 'Провести 1:1 и разгрузить план на неделю.', status: 'risk' },
        { department: 'Поддержка', issue: 'снижение климата', action: 'Ретро-коммуникация, перераспределение очереди.', status: 'risk' },
      ]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low':
      case 'ok':
        return 'var(--green)';
      case 'risk':
        return 'var(--yellow)';
      case 'critical':
        return 'var(--red)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'low':
        return 'Низкий';
      case 'ok':
        return 'Ок';
      case 'risk':
        return 'Риск';
      case 'critical':
        return 'Критично';
      default:
        return status;
    }
  };

  if (!metrics) return <div className="dashboard-loading">Загрузка...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Мониторинг состояния коллектива</h1>
          <p className="breadcrumb">Пульс-опросы → индексы → проблемные зоны по отделам</p>
        </div>

        <div className="header-actions">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Поиск по отделам / метрикам..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="btn-purple" onClick={() => navigate('/app/surveys/create')}>
            <Plus size={18} />
            Новый опрос
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <h3>Индекс благополучия</h3>
            <span className="status-badge" style={{ backgroundColor: getStatusColor(metrics.wellbeingIndex.status) }}>
              {getStatusLabel(metrics.wellbeingIndex.status)}
            </span>
          </div>
          <div className="metric-value">{metrics.wellbeingIndex.overall}</div>
          <p className="metric-description">Сводный показатель по последним 14 дням (агрегировано).</p>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Риск выгорания</h3>
            <span className="status-badge" style={{ backgroundColor: getStatusColor(metrics.burnoutRisk.status) }}>
              {getStatusLabel(metrics.burnoutRisk.status)}
            </span>
          </div>
          <div className="metric-value">{metrics.burnoutRisk.value}%</div>
          <p className="metric-description">Доля сигналов усталости/стресса в ответах.</p>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Напряжение/конфликты</h3>
            <span className="status-badge" style={{ backgroundColor: getStatusColor(metrics.tensionConflicts.status) }}>
              {getStatusLabel(metrics.tensionConflicts.status)}
            </span>
          </div>
          <div className="metric-value">{metrics.tensionConflicts.value}%</div>
          <p className="metric-description">Сигналы ухудшения климата в командах.</p>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Охват опроса</h3>
            <span className="status-badge light">{metrics.surveyCoverage.period}</span>
          </div>
          <div className="metric-value">{metrics.surveyCoverage.value}%</div>
          <p className="metric-description">Чем выше охват — тем точнее индексы и зоны риска.</p>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Динамика благополучия</h2>
        <p className="section-subtitle">Тренд по неделям (пример данных)</p>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={dynamics}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: 12,
                }}
              />
              <Line type="monotone" dataKey="value" stroke="var(--purple)" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Проблемные зоны</h2>
            <p className="section-subtitle">Топ-3 зоны по суммарному риску</p>
          </div>
          <button className="btn-secondary" type="button">
            Агрегировано
          </button>
        </div>

        <div className="problem-zones">
          {problemZones.map((zone, idx) => (
            <div key={idx} className="problem-zone-card">
              <div className="zone-header">
                <h3>{zone.department}</h3>
                <span className="status-badge" style={{ backgroundColor: getStatusColor(zone.status) }}>
                  {getStatusLabel(zone.status)}
                </span>
              </div>
              <p className="zone-factor">{zone.factor}</p>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${zone.score}%`,
                    backgroundColor: getStatusColor(zone.status),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Рекомендации HR / Руководителю</h2>
        <p className="section-subtitle">Автоподсказки на основе индексов (пример)</p>

        <div className="recommendations">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="recommendation-card">
              <div>
                <h3>
                  Отдел “{rec.department}”: {rec.issue}
                </h3>
                <p>{rec.action}</p>
              </div>
              <span className="rec-badge">Внимание</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
