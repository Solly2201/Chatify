import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, RefreshCw, Pencil } from "lucide-react";
import { highlightChildren } from "../services/lookup";

// Elements whose text children get lookup highlighting (code is left alone).
const HIGHLIGHTABLE = ["p", "li", "h1", "h2", "h3", "strong", "em", "td", "th", "blockquote", "a"];

function highlightComponents(query, counter, activeLocal) {
  const components = {};
  for (const tag of HIGHLIGHTABLE) {
    components[tag] = ({ node, children, ...props }) => {
      const Tag = tag;
      return <Tag {...props}>{highlightChildren(children, query, counter, activeLocal)}</Tag>;
    };
  }
  return components;
}

export function AiSymbol({ glow = false }) {
  return <span className={`text-accent select-none ${glow ? "ai-glow" : ""}`}>◈</span>;
}

export default function MessageBubble({ msg, isLast, streaming, meta, onRegenerate, onEdit, search }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === "user";
  const counter = { n: 0 };
  const searching = !!search?.query;

  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  if (isUser) {
    return (
      <div className="group flex justify-end animate-fade-up">
        <div className="max-w-[75%] flex items-end gap-2">
          <button
            onClick={() => onEdit(msg)}
            className="opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-neutral-300 transition-opacity mb-2"
            title="Edit & resend"
          >
            <Pencil size={13} />
          </button>
          <div className="bg-accent/90 text-white rounded-2xl rounded-br-md px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap shadow-lg shadow-accent/10">
            {searching ? highlightChildren([msg.content], search.query, counter, search.activeLocal) : msg.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex gap-3 animate-fade-up">
      <div className="mt-1.5 text-sm">
        <AiSymbol glow={streaming} />
      </div>
      <div className="max-w-[80%]">
        <div className="bg-ink-800 border border-ink-700/50 rounded-2xl rounded-bl-md px-4 py-3 text-[15px]">
          <div className="markdown">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={searching ? highlightComponents(search.query, counter, search.activeLocal) : undefined}
            >
              {msg.content}
            </ReactMarkdown>
            {streaming && <span className="inline-block w-2 h-4 bg-accent-soft ml-0.5 align-text-bottom animate-blink rounded-sm" />}
          </div>
        </div>
        {!streaming && (
          <div className="flex items-center gap-3 mt-1.5 px-1">
            <button
              onClick={copy}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[12px] text-neutral-600 hover:text-neutral-300 transition-all"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
            </button>
            {isLast && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[12px] text-neutral-600 hover:text-neutral-300 transition-all"
                title="Regenerate with the currently selected tone"
              >
                <RefreshCw size={12} /> Regenerate
              </button>
            )}
            {isLast && meta && (
              <span className="text-[11px] text-neutral-600 ml-auto">
                {meta.model} · {(meta.responseMs / 1000).toFixed(1)}s
                {meta.usage ? ` · ${meta.usage.total_tokens} tokens` : ""}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
