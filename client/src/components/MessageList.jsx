import { useEffect, useRef } from "react";
import MessageBubble, { AiSymbol } from "./MessageBubble";

const SUGGESTIONS = [
  "Explain this with an analogy",
  "Give me a real-world example",
  "How does this work internally?"
];

export default function MessageList({ messages, streaming, streamText, meta, error, onRegenerate, onEdit, onSuggestion }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText, streaming]);

  const lastAssistantIdx = [...messages].map((m) => m.role).lastIndexOf("assistant");
  const showSuggestions = !streaming && messages.length > 0 && messages[messages.length - 1].role === "assistant";

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
      {messages.length === 0 && !streaming && (
        <div className="h-full flex flex-col items-center justify-center text-center gap-3">
          <span className="text-4xl text-accent ai-glow">◈</span>
          <div className="text-lg font-medium text-neutral-200">How can I help you today?</div>
          <div className="text-sm text-neutral-500 max-w-sm">
            Ask anything — pick a tone below to shape how I respond.
          </div>
        </div>
      )}

      {messages.map((msg, i) => (
        <MessageBubble
          key={msg._id || i}
          msg={msg}
          isLast={i === lastAssistantIdx && i === messages.length - 1}
          meta={meta}
          onRegenerate={onRegenerate}
          onEdit={onEdit}
        />
      ))}

      {streaming &&
        (streamText ? (
          <MessageBubble msg={{ role: "assistant", content: streamText }} streaming />
        ) : (
          <div className="flex items-center gap-3 animate-fade-up">
            <AiSymbol glow />
            <span className="text-neutral-500 text-sm flex items-center gap-1.5">
              Generating
              <span className="flex gap-1">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="w-1 h-1 rounded-full bg-accent-soft animate-blink"
                    style={{ animationDelay: `${d * 0.25}s` }}
                  />
                ))}
              </span>
            </span>
          </div>
        ))}

      {showSuggestions && (
        <div className="flex flex-wrap gap-2 pl-7">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestion(s)}
              className="text-[12px] text-neutral-400 hover:text-neutral-200 bg-ink-800 hover:bg-ink-700 border border-ink-700/60 rounded-full px-3 py-1.5 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
