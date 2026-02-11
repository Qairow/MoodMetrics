import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Send } from "lucide-react";
import { api } from "../api";
import "./SurveyDetails.css";

type Question={id:string;text:string;type:string};
type Survey={id:string;name:string;template:{questions:Question[]};};

export default function SurveyDetails(){
  const { id }=useParams<{id:string}>();
  const navigate=useNavigate();
  const [survey,setSurvey]=useState<Survey|null>(null);
  const [loading,setLoading]=useState(true);
  const [sending,setSending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [answers,setAnswers]=useState<Record<string,number>>({});

  useEffect(()=>{
    if(!id) return;
    (async()=>{
      try{
        setLoading(true);
        setError(null);
        const res=await api.get(`/surveys/${id}`);
        setSurvey(res.data);

        const initial:Record<string,number>={};
        const qs:Question[]=res.data?.template?.questions??[];
        qs.forEach(q=>initial[q.id]=3);
        setAnswers(initial);
      } catch(e:any){
        setError(e?.response?.data?.error||"Survey not found");
      } finally{
        setLoading(false);
      }
    })();
  },[id]);

  const questions=useMemo(()=>survey?.template?.questions??[],[survey]);
  const canSend=survey&&questions.length>0&&Object.keys(answers).length===questions.length;

  const onSend=async()=>{
    if(!id||!canSend) return;
    try{
      setSending(true);
      setError(null);
      await api.post(`/surveys/${id}/responses`,{
        answers:Object.entries(answers).map(([questionId,value])=>({questionId,value}))
      });
      navigate("/app/surveys");
    } catch(e:any){
      setError(e?.response?.data?.error||"Не удалось отправить ответы");
    } finally{
      setSending(false);
    }
  };

  if(loading) return <div className="page survey-details">Загрузка…</div>;

  return(
    <div className="page survey-details">
      <div className="page-header">
        <div>
          <h1 className="page-title">{survey?.name||"Опрос"}</h1>
          <div className="page-subtitle">Ответь по шкале 1–5</div>
        </div>

        <div className="page-actions">
          <button className="btn btn-secondary" type="button" onClick={()=>navigate(-1)}>
            <ChevronLeft size={18}/>Назад
          </button>

          <button className="btn btn-primary" type="button" onClick={onSend} disabled={!canSend||sending}>
            <Send size={18}/>{sending?"Отправка…":"Отправить"}
          </button>
        </div>
      </div>

      <div className="card">
        {error&&<div className="alert alert-error">{error}</div>}

        {!survey||questions.length===0?(
          <div className="empty"><b>В этом опросе нет вопросов.</b></div>
        ):(
          <div className="questions">
            {questions.map((q,idx)=>(
              <div className="q" key={q.id}>
                <div className="q-title"><span className="q-num">{idx+1}</span>{q.text}</div>
                <div className="scale">
                  {[1,2,3,4,5].map(v=>(
                    <button key={v} type="button"
                      className={`scale-btn ${answers[q.id]===v?"active":""}`}
                      onClick={()=>setAnswers(prev=>({...prev,[q.id]:v}))}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
