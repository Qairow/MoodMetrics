import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import PsychChatWidget from "../components/PsychChatWidget";
import "./Layout.css";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      {/* Сайдбар (fixed) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ✅ Placeholder — занимает место сайдбара на десктопе */}
      <div className="sidebar-spacer" />

      {/* Основной контент */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Мобильный топбар */}
        <header className="mobile-topbar">
          <button
            className="burger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Открыть меню"
            type="button"
          >
            <Menu size={22} />
          </button>
          <div className="mobile-title">MoodMetrics</div>
        </header>

        <PsychChatWidget />

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}