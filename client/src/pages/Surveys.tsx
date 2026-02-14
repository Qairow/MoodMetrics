import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Play, Wand2, BarChart3, Archive, RotateCcw } from "lucide-react";
import { api } from "../api";
import "./Surveys.css";
import {safeArray } from "../utils/safe";


type SurveyRow={
  id:string;
  name:string;
  departments:string[];
  status:"active"|"draft"|"closed";
  anonymityThreshold:number;
  createdAt:string;
  templateName?:string;
  archived?:boolean;
};

type TabKey="active"|"archived";

const statusUi:Record<string,{label:string;cls:string}>={
  active:{label:"active",cls:"status status--active"},
  draft:{label:"draft",cls:"status status--draft"},
  closed:{label:"closed",cls:"status status--closed"},
};

export default function Surveys(){
  const navigate=useNavigate();
  const [rows,setRows]=useState<SurveyRow[]>([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState<TabKey>("active");

  const load=async()=>{
    try{
      setLoading(true);
     const res = await api.get("/surveys");
setRows(safeArray<SurveyRow>(res.data));
const data = res.data;

// делаем rows ВСЕГДА массивом
const list =
  Array.isArray(data) ? data :
  Array.isArray(data?.surveys) ? data.surveys :
  Array.isArray(data?.items) ? data.items :
  Array.isArray(data?.data) ? data.data :
  [];

setRows(list);

    } finally{
      setLoading(false);
    }
  };

  useEffect(()=>{load();},[]);

  const activeRows=useMemo(()=>rows.filter(s=>!s.archived),[rows]);
  const archivedRows=useMemo(()=>rows.filter(s=>!!s.archived),[rows]);
  const tableRows=tab==="active"?activeRows:archivedRows;

  const onArchive=async(id:string)=>{
    await api.patch(`/surveys/${id}/archive`);
    await load();
  };

  const onUnarchive=async(id:string)=>{
    await api.patch(`/surveys/${id}/unarchive`);
    await load();
  };

  return(
    <div className="mm-page">
      <div className="mm-head">
        <div>
          <h1 className="mm-title">Опросы</h1>
          <div className="mm-subtitle">Управление опросами по отделам</div>
        </div>

        <button className="mm-btn mm-btn--primary" onClick={()=>navigate("/app/surveys/create")}>
          <Plus size={18}/>Новый опрос
        </button>
      </div>

      <div className="surveys-grid">
        <section className="mm-card mm-card--pad">
          <div className="mm-cardhead">
            <div className="mm-cardtitle">
              <span className="mm-iconbox"><BarChart3 size={18}/></span>
              <div>
                <div className="mm-h3">Список опросов</div>
                <div className="mm-muted">Статусы и отделы</div>
              </div>
            </div>
            <div className="mm-badgecount">{tableRows.length}</div>
          </div>

          <div className="mm-tabs">
            <button className={"mm-tab "+(tab==="active"?"is-active":"")} onClick={()=>setTab("active")} type="button">
              Активные <span className="mm-tabcount">{activeRows.length}</span>
            </button>
            <button className={"mm-tab "+(tab==="archived"?"is-active":"")} onClick={()=>setTab("archived")} type="button">
              Архив <span className="mm-tabcount">{archivedRows.length}</span>
            </button>
          </div>

          <div className="mm-tablewrap">
            <table className="mm-table">
              <thead>
                <tr>
                  <th>НАЗВАНИЕ</th>
                  <th>ОТДЕЛЫ</th>
                  <th>СТАТУС</th>
                  <th>ПОРОГ</th>
                  <th>ДЕЙСТВИЕ</th>
                </tr>
              </thead>

              <tbody>
                {loading?(
                  <tr><td colSpan={5} className="mm-empty">Загрузка...</td></tr>
                ):tableRows.length===0?(
                  <tr><td colSpan={5} className="mm-empty">{tab==="active"?"Нет активных опросов.":"Архив пуст."}</td></tr>
                ):(
                  tableRows.map((s)=>(
                    <tr key={s.id}>
                      <td className="mm-strong">{s.name}</td>
                      <td className="mm-muted">
                        {Array.isArray(s.departments)&&s.departments.length
                          ? s.departments.slice(0,2).join(", ")+(s.departments.length>2?`, +${s.departments.length-2}`:"")
                          : "—"}
                      </td>
                      <td>
                        <span className={statusUi[s.status]?.cls??"status"}>
                          {statusUi[s.status]?.label??s.status}
                        </span>
                      </td>
                      <td className="mm-muted">{s.anonymityThreshold??"—"}</td>

                      <td className="mm-actions">
                        <button className="mm-btn mm-btn--ghost" onClick={()=>navigate(`/app/surveys/${s.id}`)}>
                          <Play size={16}/>Открыть
                        </button>

                        {s.archived?(
                          <button className="mm-btn mm-btn--light" onClick={()=>onUnarchive(s.id)} type="button">
                            <RotateCcw size={16}/>Вернуть
                          </button>
                        ):(
                          <button className="mm-btn mm-btn--light" onClick={()=>onArchive(s.id)} type="button">
                            <Archive size={16}/>В архив
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="mm-card mm-card--pad">
          <div className="mm-cardhead">
            <div className="mm-cardtitle">
              <span className="mm-iconbox"><Wand2 size={18}/></span>
              <div>
                <div className="mm-h3">Быстрые действия</div>
                <div className="mm-muted">Создание и управление</div>
              </div>
            </div>
          </div>

          <div className="quick">
            <button className="quick-item" onClick={()=>navigate("/app/surveys/create")}>
              <span className="quick-ico"><Plus size={18}/></span>
              <span><span className="quick-title">Создать опрос</span><span className="quick-sub">Собери форму из шаблона</span></span>
            </button>

            <button className="quick-item" type="button">
              <span className="quick-ico"><Wand2 size={18}/></span>
              <span><span className="quick-title">Использовать шаблон</span><span className="quick-sub">Готовые наборы вопросов</span></span>
            </button>

            <button className="quick-item" type="button">
              <span className="quick-ico"><BarChart3 size={18}/></span>
              <span><span className="quick-title">Просмотреть аналитику</span><span className="quick-sub">Статистика по отделам</span></span>
            </button>

            <div className="mm-dashedbox">
              <div className="mm-dashed-title">Создайте свой первый опрос</div>
              <div className="mm-muted" style={{marginTop:6}}>Начните собирать обратную связь от команд прямо сейчас</div>
              <div className="mm-dashed-actions">
                <button className="mm-btn mm-btn--primary" onClick={()=>navigate("/app/surveys/create")}>
                  <Plus size={18}/>Создать опрос
                </button>
                <button className="mm-btn mm-btn--light" type="button">Шаблоны вопросов →</button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
