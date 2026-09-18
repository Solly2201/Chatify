const BASE = "/api";

async function json(res) {
  if (!res.ok) {
    let msg = "Request failed";
    try {
      msg = (await res.json()).error || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  listConversations: () => fetch(`${BASE}/conversations`).then(json),
  createConversation: (body) =>
    fetch(`${BASE}/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(json),
  getConversation: (id) => fetch(`${BASE}/conversations/${id}`).then(json),
  deleteConversation: (id) => fetch(`${BASE}/conversations/${id}`, { method: "DELETE" }).then(json)
};

// Streams an assistant reply over SSE-style chunked HTTP.
export async function streamMessage(conversationId, body, { onChunk, onDone, onError, signal }) {
  try {
    const res = await fetch(`${BASE}/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal
    });
    if (!res.ok) {
      let msg = "Request failed";
      try {
        msg = (await res.json()).error || msg;
      } catch {}
      throw new Error(msg);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop();
      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data:")) continue;
        const event = JSON.parse(line.slice(5));
        if (event.type === "chunk") onChunk(event.content);
        else if (event.type === "done") onDone(event);
        else if (event.type === "error") onError(new Error(event.error));
      }
    }
  } catch (err) {
    if (err.name === "AbortError") return;
    onError(err);
  }
}
