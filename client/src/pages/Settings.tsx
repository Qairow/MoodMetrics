import { useEffect, useState } from "react";
import { Save, Shield, Bell, Users } from "lucide-react";

import "./Settings.css";
import { api } from "../api";
type RoleKey = "admin" | "manager" | "employee" | "hr";

export default function Settings() {
  const [threshold, setThreshold] = useState<number>(7);
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(true);
  const [activeRoles, setActiveRoles] = useState<RoleKey[]>(["admin", "manager", "employee", "hr"]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  (async () => {
    const res = await api.get('/settings');
    setThreshold(res.data.anonymityThreshold ?? 7);
    setRemindersEnabled(!!res.data.remindersEnabled);
  })();
}, []);


const onSave = async () => {
  try {
    setLoading(true);
    await api.put('/settings', {
      anonymityThreshold: threshold,
      remindersEnabled,
    });
    alert('Сохранено');
  } catch (e) {
    alert('Ошибка сохранения');
  } finally {
    setLoading(false);
  }
};


  const toggleRole = (role: RoleKey) => {
    setActiveRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  return (
    <div className="mm-page">
      <div className="mm-pageHeader">
        <div>
          <h1 className="mm-title">Настройки</h1>
          <p className="mm-subtitle">Роли, анонимность, уведомления</p>
        </div>

        <button className="mm-btn mm-btnPrimary" onClick={onSave}>
          <Save size={18} />
          Сохранить
        </button>
      </div>

      <div className="mm-settingsGrid">
        {/* Анонимность */}
        <section className="mm-card">
          <div className="mm-cardHead">
            <div className="mm-cardIcon mm-iconPurple">
              <Shield size={18} />
            </div>

            <div className="mm-cardHeadText">
              <div className="mm-cardTitle">Анонимность</div>
              <div className="mm-cardDesc">Порог ответов для отображения аналитики по отделу</div>
            </div>
          </div>

          <div className="mm-formBlock">
            <label className="mm-label">Минимум ответов</label>
            <input
              className="mm-input"
              type="number"
              min={3}
              max={50}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
          </div>
        </section>

        {/* Напоминания */}
        <section className="mm-card">
          <div className="mm-cardHead">
            <div className="mm-cardIcon mm-iconBlue">
              <Bell size={18} />
            </div>

            <div className="mm-cardHeadText">
              <div className="mm-cardTitle">Напоминания</div>
              <div className="mm-cardDesc">Увеличивает охват и качество данных</div>
            </div>
          </div>

          <button
            className={`mm-toggleCard ${remindersEnabled ? "isOn" : "isOff"}`}
            onClick={() => setRemindersEnabled((v) => !v)}
            type="button"
          >
            <div className="mm-toggleDot">{remindersEnabled ? "✓" : ""}</div>

            <div className="mm-toggleText">
              <div className="mm-toggleTitle">Включить напоминания об опросе</div>
              <div className="mm-toggleDesc">Позже добавим расписание, каналы (email/telegram) и частоту.</div>
            </div>
          </button>
        </section>

        {/* Роли */}
        <section className="mm-card">
          <div className="mm-cardHead">
            <div className="mm-cardIcon mm-iconGreen">
              <Users size={18} />
            </div>

            <div className="mm-cardHeadText">
              <div className="mm-cardTitle">Роли</div>
              <div className="mm-cardDesc">Доступ по ролям (MVP)</div>
            </div>
          </div>

          <div className="mm-roleChips">
            <button
              type="button"
              className={`mm-chip ${activeRoles.includes("admin") ? "isActive" : ""}`}
              onClick={() => toggleRole("admin")}
            >
              Admin
            </button>
            <button
              type="button"
              className={`mm-chip ${activeRoles.includes("manager") ? "isActive" : ""}`}
              onClick={() => toggleRole("manager")}
            >
              Руководитель
            </button>
            <button
              type="button"
              className={`mm-chip ${activeRoles.includes("employee") ? "isActive" : ""}`}
              onClick={() => toggleRole("employee")}
            >
              Сотрудник
            </button>
            <button
              type="button"
              className={`mm-chip ${activeRoles.includes("hr") ? "isActive" : ""}`}
              onClick={() => toggleRole("hr")}
            >
              HR
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
