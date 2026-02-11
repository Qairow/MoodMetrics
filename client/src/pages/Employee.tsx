import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Activity, AlertTriangle, Smile } from "lucide-react";
import "./Employee.css";

type Employee = {
  id: string;
  name: string;
  email: string;
  role: "employee" | "manager" | "hr" | "admin";
  department: string | null;
  position: string | null;
  createdAt?: string;
};

type Dept = { name: string };

function shortName(full: string) {
  // "Иванов Иван Иванович" -> "Иванов И.И."
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return full;
  if (parts.length === 1) return parts[0];
  const last = parts[0];
  const first = parts[1]?.[0] ? `${parts[1][0]}.` : "";
  const mid = parts[2]?.[0] ? `${parts[2][0]}.` : "";
  return `${last} ${first}${mid}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// имитация индексов/рисков (пока нет реальной аналитики)
// если у тебя уже есть API для индексов — заменишь здесь.
function fakeIndexFromId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 100000;
  const idx = 45 + (hash % 46); // 45..90
  const risk = clamp(100 - idx + (hash % 15), 5, 90); // 5..90
  return { idx, risk };
}

function lastPulseText(id: string) {
  // тоже заглушка
  const n = (id.length * 7) % 8;
  if (n <= 1) return "вчера";
  if (n <= 3) return `${n} дн. назад`;
  return `${n - 2} нед. назад`;
}

export default function Employees() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [deptFilter, setDeptFilter] = useState<string>("Все отделы");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [empRes, deptRes] = await Promise.all([
          api.get<Employee[]>("/employees"),
          api.get<Dept[]>("/employees/departments"),
        ]);
        setEmployees(empRes.data || []);
        setDepartments(deptRes.data || []);
      } catch (e) {
        console.error("Failed to load employees", e);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (deptFilter === "Все отделы") return employees;
    return employees.filter((e) => (e.department || "Без отдела") === deptFilter);
  }, [employees, deptFilter]);

  const summary = useMemo(() => {
    if (!filtered.length) {
      return {
        total: 0,
        avgIndex: 0,
        highRisk: 0,
        okCount: 0,
      };
    }

    const metrics = filtered.map((e) => fakeIndexFromId(e.id));
    const avgIndex = Math.round(metrics.reduce((s, m) => s + m.idx, 0) / metrics.length);
    const highRisk = metrics.filter((m) => m.risk >= 60).length;
    const okCount = metrics.filter((m) => m.risk < 35).length;

    return {
      total: filtered.length,
      avgIndex,
      highRisk,
      okCount,
    };
  }, [filtered]);

  return (
    <div className="page employees-page">
      <div className="page-header employees-header">
        <div>
          <h1 className="page-title">Сотрудники</h1>
          <div className="page-subtitle">Сводка по команде и рискам (агрегировано)</div>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => navigate("/app/surveys/create")}>
            <Plus size={18} />
            Новый опрос
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="employees-stats">
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon">
              <Users size={18} />
            </div>
            <div className="stat-title">Сотрудников</div>
          </div>
          <div className="stat-value">{summary.total}</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon">
              <Activity size={18} />
            </div>
            <div className="stat-title">Средний индекс</div>
          </div>
          <div className="stat-value">{summary.avgIndex}</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon">
              <AlertTriangle size={18} />
            </div>
            <div className="stat-title">Высокий риск</div>
          </div>
          <div className="stat-value">{summary.highRisk}</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon">
              <Smile size={18} />
            </div>
            <div className="stat-title">Ок состояние</div>
          </div>
          <div className="stat-value">{summary.okCount}</div>
        </div>
      </div>

      {/* Table */}
      <div className="card employees-card">
        <div className="employees-card-head">
          <div>
            <div className="employees-card-title">Список сотрудников</div>
            <div className="employees-card-subtitle">Фильтр по отделу</div>
          </div>

          <select
            className="field employees-dept-select"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option>Все отделы</option>
            {departments.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
            {/* если в БД есть null department */}
            <option value="Без отдела">Без отдела</option>
          </select>
        </div>

        <div className="employees-table">
          <div className="employees-table-head">
            <div>Сотрудник</div>
            <div>Отдел</div>
            <div>Индекс</div>
            <div>Риск</div>
            <div>Последний пульс</div>
          </div>

          {loading ? (
            <div className="employees-loading">Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div className="employees-empty">
          
            </div>
          ) : (
            filtered.map((e) => {
              const { idx, risk } = fakeIndexFromId(e.id);
              const dept = e.department || "Без отдела";
              return (
                <div className="employees-row" key={e.id}>
                  <div className="emp-name">
                    <div className="emp-title">{shortName(e.name)}</div>
                    <div className="emp-sub">{e.position || e.email}</div>
                  </div>

                  <div className="emp-muted">{dept}</div>

                  <div className="emp-badge">{idx}</div>

                  <div className="emp-badge">{risk}%</div>

                  <div className="emp-muted">{lastPulseText(e.id)}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
