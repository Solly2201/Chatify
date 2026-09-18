import React from "react";

// In-conversation text lookup helpers: plain case-insensitive substring
// matching over message content, highlighted client-side with <mark>.

export function countMatches(text, query) {
  if (!query) return 0;
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  let n = 0;
  let i = 0;
  while ((i = t.indexOf(q, i)) !== -1) {
    n++;
    i += q.length;
  }
  return n;
}

// Wraps each occurrence of query found in string children with <mark>.
// `counter` persists across a whole message render so occurrences get a
// stable order; the one equal to activeLocal is the currently active match.
export function highlightChildren(children, query, counter, activeLocal) {
  const q = query.toLowerCase();
  return React.Children.map(children, (child) => {
    if (typeof child !== "string") return child;
    const lower = child.toLowerCase();
    const parts = [];
    let last = 0;
    let i;
    while ((i = lower.indexOf(q, last)) !== -1) {
      if (i > last) parts.push(child.slice(last, i));
      const isActive = counter.n === activeLocal;
      counter.n++;
      parts.push(
        <mark
          key={`${i}-${counter.n}`}
          data-active={isActive || undefined}
          className={
            isActive
              ? "bg-accent text-white rounded-sm px-0.5"
              : "bg-amber-400/40 text-inherit rounded-sm px-0.5"
          }
        >
          {child.slice(i, i + q.length)}
        </mark>
      );
      last = i + q.length;
    }
    if (parts.length === 0) return child;
    if (last < child.length) parts.push(child.slice(last));
    return parts;
  });
}
