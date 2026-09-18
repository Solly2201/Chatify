import { useEffect, useRef } from "react";
import MessageBubble, { AiSymbol } from "./MessageBubble";
import { countMatches } from "../services/lookup";

// Deterministic follow-up chips derived from the last user question —
// no extra AI call, just cheap intent + topic heuristics.
function extractTopic(text) {
  const topic = text
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(what|who|when|where|why|how|can you|could you|please|tell me about)(\s+(is|are|does|do|can|would|should|did))?\s+/i, "")
    .replace(/[?.!,;:]+$/, "");
  return topic.length > 2 && topic.length <= 40 ? topic : null;
}

function deriveSuggestions(messages) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return [];
  const text = lastUser.content.toLowerCase();
  const topic = extractTopic(lastUser.content);

  if (/\bvs\.?\b|\bversus\b|compare|difference between/.test(text)) {
    return ["What are the key differences?", "When should I use each?", "Summarize this as a comparison table"];
  }
  if (/\bcode\b|implement|function|\bapi\b|\berror\b|\bbug\b|debug|syntax/.test(text)) {
    return ["Can you show a code example?", "What are the common mistakes?", "How would I test this?"];
  }
  if (/explain|why |how does|how do/.test(text)) {
    return ["Can you simplify that?", "Explain it with an analogy", "What are the key takeaways?"];
  }
  if (topic) {
    return [
      `How does ${topic} work internally?`,
      `Give me a real-world example of ${topic}`,
      `What are practical applications of ${topic}?`
    ];
  }
  return ["Explain this with an analogy", "Give me a real-world example", "How does this work internally?"];
}

export default function MessageList({ messages, streaming, streamText, meta, error, onRegenerate, onEdit, onSuggestion, find }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText, streaming]);

  // Scroll the active lookup match into view whenever it changes.
  useEffect(() => {
    if (find?.query) {
      document.querySelector("mark[data-active]")?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [find?.query, find?.activeGlobal]);

  // Map the global active-match index to a per-message occurrence index.
  const searchPerMsg = messages.map(() => null);
  if (find?.query) {
    let before = 0;
    messages.forEach((m, i) => {
      const n = countMatches(m.content, find.query);
      const activeLocal = find.activeGlobal >= before && find.activeGlobal < before + n ? find.activeGlobal - before : -1;
      searchPerMsg[i] = { query: find.query, activeLocal };
      before += n;
    });
  }

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
          search={searchPerMsg[i]}
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
          {deriveSuggestions(messages).map((s) => (
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
