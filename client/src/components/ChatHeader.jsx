import { useState } from "react";
import { Ghost, Info } from "lucide-react";
import { TONES } from "../hooks/useChat";

export default function ChatHeader({ title, messageCount, tone, temporary, meta, convoInfo }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const toneLabel = TONES.find((t) => t.id === tone)?.label || tone;

  return (
    <header className="relative flex items-center justify-between px-6 py-3.5 border-b border-ink-700/60 bg-ink-900/60 backdrop-blur">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-accent ai-glow">◈</span>
        <div className="min-w-0">
          <div className="font-medium text-neutral-100 truncate text-[15px]">{title || "Chatify"}</div>
          <div className="text-[12px] text-neutral-500">AI Assistant</div>
        </div>
        {temporary && (
          <span className="flex items-center gap-1 text-[11px] text-violet-300 bg-accent-violet/10 border border-accent-violet/30 rounded-full px-2.5 py-1">
            <Ghost size={11} /> Temporary Chat
          </span>
        )}
      </div>
      <button
        onClick={() => setPanelOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[12px] text-neutral-500 hover:text-neutral-300 bg-ink-800 border border-ink-700/60 rounded-full px-3 py-1.5 transition-colors"
      >
        <Info size={12} />
        {messageCount} message{messageCount === 1 ? "" : "s"}
      </button>

      {panelOpen && (
        <div className="absolute right-6 top-full mt-2 z-20 w-64 bg-ink-850 border border-ink-600/60 rounded-xl shadow-2xl shadow-black/50 p-4 text-[13px] space-y-2 animate-fade-up">
          <div className="font-medium text-neutral-200 mb-1">Context</div>
          <Row label="Messages" value={messageCount} />
          <Row label="Tone" value={toneLabel} />
          <Row label="Model" value={meta?.model || "gpt-4o-mini"} />
          <Row
            label="Started"
            value={convoInfo?.createdAt ? new Date(convoInfo.createdAt).toLocaleString() : "—"}
          />
          <Row label="Storage" value={temporary ? "In memory only" : "MongoDB"} />
        </div>
      )}
    </header>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-neutral-500">{label}</span>
      <span className="text-neutral-300 text-right truncate">{value}</span>
    </div>
  );
}
