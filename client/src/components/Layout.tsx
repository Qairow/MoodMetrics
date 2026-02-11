import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import "./Layout.css";
import PsychChatWidget from "../components/PsychChatWidget";

export default function Layout(){
  const [sidebarOpen,setSidebarOpen]=useState(false);
  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} onClose={()=>setSidebarOpen(false)} />

      <header className="mobile-topbar">
        <button className="burger" onClick={()=>setSidebarOpen(true)} type="button">
          <Menu size={22}/>
        </button>
        <div className="mobile-title">MoodMetrics</div>
      </header>

      <PsychChatWidget />

      <main className="main-content">
        <Outlet/>
      </main>
    </div>
  );
}

