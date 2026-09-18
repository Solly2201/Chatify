import { useMemo, useState } from "react";
import { Plus, Search, MessageSquare, Trash2, Ghost, LogOut } from "lucide-react";

function groupByDate(conversations) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const groups = { Today: [], Yesterday: [], Earlier: [] };
  for (const c of conversations) {
    const d = new Date(c.updatedAt).toDateString();
    if (d === today) groups.Today.push(c);
    else if (d === yesterday) groups.Yesterday.push(c);
    else groups.Earlier.push(c);
  }
  return groups;
}

export default function Sidebar({ conversations, activeId, onNew, onNewTemp, onOpen, onDelete, searchRef, onLogout }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => conversations.filter((c) => c.title.toLowerCase().includes(query.toLowerCase())),
    [conversations, query]
  );
  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <aside className="w-72 shrink-0 bg-ink-900 border-r border-ink-700/60 flex flex-col">
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2 px-1 pt-1 pb-2">
          <span className="text-accent text-lg ai-glow">◈</span>
          <span className="font-semibold text-neutral-100 tracking-tight">Chatify</span>
        </div>
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 bg-accent/15 hover:bg-accent/25 text-accent-soft border border-accent/25 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
        >
          <Plus size={16} /> New Chat
        </button>
        <button
          onClick={onNewTemp}
          className="w-full flex items-center gap-2 hover:bg-ink-800 text-neutral-400 border border-ink-700/60 rounded-xl px-3 py-2 text-sm transition-colors"
        >
          <Ghost size={15} /> Temporary Chat
        </button>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            className="w-full bg-ink-850 border border-ink-700/60 rounded-xl pl-8 pr-3 py-2 text-sm placeholder:text-neutral-600 focus:outline-none focus:border-accent/40"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
        {Object.entries(groups).map(
          ([label, items]) =>
            items.length > 0 && (
              <div key={label}>
                <div className="text-[11px] uppercase tracking-wider text-neutral-600 px-1 mb-1.5">{label}</div>
                <div className="space-y-0.5">
                  {items.map((c) => (
                    <div
                      key={c._id}
                      onClick={() => onOpen(c._id)}
                      className={`group flex items-center gap-2 rounded-lg px-2.5 py-2 cursor-pointer text-sm transition-colors ${
                        c._id === activeId
                          ? "bg-ink-700/70 text-neutral-100"
                          : "text-neutral-400 hover:bg-ink-800 hover:text-neutral-200"
                      }`}
                    >
                      <MessageSquare size={14} className="shrink-0 text-neutral-600" />
                      <span className="truncate flex-1">{c.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(c._id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-red-400 transition-opacity"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
        )}
        {filtered.length === 0 && (
          <div className="text-sm text-neutral-600 px-1 pt-2">No conversations yet.</div>
        )}
      </div>

      <div className="p-3 border-t border-ink-700/60 flex items-center justify-between">
        <span className="text-[12px] text-neutral-600">Demo account · quantiphi</span>
        <button
          onClick={onLogout}
          className="flex items-center gap-1 text-[12px] text-neutral-500 hover:text-neutral-200 transition-colors"
          title="Log out"
        >
          <LogOut size={13} /> Log out
        </button>
      </div>
    </aside>
  );
}
