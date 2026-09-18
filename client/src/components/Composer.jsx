import { useEffect, useRef, useState } from "react";
import { SendHorizontal, Square, X } from "lucide-react";
import { TONES } from "../hooks/useChat";

export default function Composer({ onSend, onStop, streaming, tone, setTone, editing, cancelEdit }) {
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) {
      setText(editing.content);
      inputRef.current?.focus();
    }
  }, [editing]);

  const submit = () => {
    const value = text.trim();
    if (!value || streaming) return;
    onSend(value);
    setText("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const activeTone = TONES.find((t) => t.id === tone);

  return (
    <div className="px-6 pb-5 pt-2">
      {editing && (
        <div className="flex items-center gap-2 text-[12px] text-amber-400/90 mb-1.5 px-1">
          Editing message — sending will rebuild the response
          <button onClick={cancelEdit} className="text-neutral-500 hover:text-neutral-300">
            <X size={13} />
          </button>
        </div>
      )}
      <div className="bg-ink-800 border border-ink-700/60 rounded-2xl p-2.5 focus-within:border-accent/40 transition-colors">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          rows={Math.min(6, Math.max(1, text.split("\n").length))}
          placeholder="Message Chatify…"
          className="w-full bg-transparent resize-none text-[15px] placeholder:text-neutral-600 focus:outline-none px-2 py-1"
        />
        <div className="flex items-center justify-between pt-1.5">
          <div className="flex items-center gap-2">
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="bg-ink-850 border border-ink-700/60 rounded-lg text-[13px] text-neutral-300 px-2 py-1.5 focus:outline-none focus:border-accent/40 cursor-pointer"
            >
              {TONES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <span className="text-[12px] text-neutral-600 hidden sm:inline">"{activeTone?.hint}"</span>
          </div>
          {streaming ? (
            <button
              onClick={onStop}
              className="flex items-center gap-1.5 bg-ink-700 hover:bg-ink-600 text-neutral-300 rounded-xl px-3.5 py-2 text-sm transition-colors"
            >
              <Square size={13} fill="currentColor" /> Stop
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!text.trim()}
              className="flex items-center gap-1.5 bg-accent hover:bg-accent-soft disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl px-3.5 py-2 text-sm font-medium transition-colors"
            >
              <SendHorizontal size={15} />
            </button>
          )}
        </div>
      </div>
      <div className="text-center text-[11px] text-neutral-700 mt-2">
        Enter to send · Shift+Enter for newline · Esc to stop
      </div>
    </div>
  );
}
