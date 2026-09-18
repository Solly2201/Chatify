import { useEffect, useRef } from "react";
import { ChevronUp, ChevronDown, X } from "lucide-react";

export default function FindBar({ query, setQuery, total, activeIdx, onNext, onPrev, onClose }) {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.shiftKey ? onPrev() : onNext();
    }
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="flex items-center gap-2 px-6 py-2 border-b border-ink-700/60 bg-ink-850 animate-fade-up">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Find in conversation"
        className="flex-1 max-w-xs bg-ink-800 border border-ink-700/60 rounded-lg px-3 py-1.5 text-[13px] placeholder:text-neutral-600 focus:outline-none focus:border-accent/40"
      />
      <span className="text-[12px] text-neutral-500 min-w-[3.5rem]">
        {query ? (total ? `${activeIdx + 1} / ${total}` : "0 matches") : ""}
      </span>
      <button onClick={onPrev} disabled={!total} className="text-neutral-500 hover:text-neutral-200 disabled:opacity-30" title="Previous (Shift+Enter)">
        <ChevronUp size={16} />
      </button>
      <button onClick={onNext} disabled={!total} className="text-neutral-500 hover:text-neutral-200 disabled:opacity-30" title="Next (Enter)">
        <ChevronDown size={16} />
      </button>
      <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200" title="Close (Esc)">
        <X size={16} />
      </button>
    </div>
  );
}
