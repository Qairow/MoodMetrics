import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { MessageCircle, X, Send } from "lucide-react";
import "./PsychChatWidget.css";

type Msg = { role: "user" | "assistant"; content: string };

export default function PsychChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Привет! Я психолог-консультант. Что сейчас беспокоит: стресс, тревога, выгорание, отношения или что-то другое?",
    },
  ]);

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }, 60);
  }, [open, msgs.length]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;

    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);

    try {
      const r = await axios.post("/api/ai/chat", { messages: next });
      const answer = String(r.data?.text || "").trim() || "Не получилось ответить. Попробуй ещё раз.";
      setMsgs((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (e: any) {
      const msg = e?.response?.data?.error || "Ошибка запроса к ИИ";
      setMsgs((prev) => [...prev, { role: "assistant", content: msg }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button className="psy-fab" onClick={() => setOpen(true)} aria-label="Открыть чат">
        <MessageCircle size={22} />
      </button>

      {open && (
        <div className="psy-overlay" onClick={() => setOpen(false)}>
          <div className="psy-card" onClick={(e) => e.stopPropagation()}>
            <div className="psy-head">
              <div className="psy-title">
                <span className="psy-dot" />
                Психолог-консультант
              </div>
              <button className="psy-close" onClick={() => setOpen(false)} aria-label="Закрыть">
                <X size={18} />
              </button>
            </div>

            <div className="psy-list" ref={listRef}>
              {msgs.map((m, i) => (
                <div key={i} className={"psy-msg " + (m.role === "user" ? "psy-msg--user" : "psy-msg--bot")}>
                  <div className="psy-bubble">{m.content}</div>
                </div>
              ))}
            </div>

            <div className="psy-foot">
              <input
                className="psy-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={busy ? "Печатает..." : "Напиши сообщение..."}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                disabled={busy}
              />
              <button className="psy-send" onClick={send} disabled={busy || !input.trim()} aria-label="Отправить">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
