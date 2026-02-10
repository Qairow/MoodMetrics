import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import "./Layout.css";
import PsychChatWidget from "../components/PsychChatWidget";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Верхняя панель только для мобилки */}
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

      <main className="main-content">
        <Outlet />
      </main>

      {/* Чат-виджет поверх всех страниц */}
      <PsychChatWidget />
    </div>
  );
}
