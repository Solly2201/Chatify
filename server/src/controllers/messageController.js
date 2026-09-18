import * as store from "../services/conversationService.js";
import { streamChat, SUPPORTED_TONES, MODEL } from "../services/aiService.js";

// POST /api/conversations/:id/messages
// Body: { message, tone, regenerate?, editMessageId? }
// Streams the assistant reply as SSE events:
//   {type:"chunk", content} | {type:"done", usage, model, messageId} | {type:"error", error}
export async function sendMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { message, tone = "casual", regenerate = false, editMessageId } = req.body || {};

    if (!SUPPORTED_TONES.includes(tone)) {
      return res.status(400).json({ error: "Invalid tone" });
    }
    if (!store.isValidId(id)) {
      return res.status(400).json({ error: "Invalid conversation ID" });
    }
    const convo = await store.getConversation(id);
    if (!convo) return res.status(404).json({ error: "Conversation not found" });

    convo.tone = tone;

    if (regenerate) {
      // Drop trailing assistant message, re-answer the last user message.
      while (convo.messages.length && convo.messages[convo.messages.length - 1].role === "assistant") {
        convo.messages.pop();
      }
      if (!convo.messages.length) {
        return res.status(400).json({ error: "Nothing to regenerate" });
      }
    } else {
      if (!message || !message.trim()) {
        return res.status(400).json({ error: "Message cannot be empty" });
      }
      if (editMessageId) {
        // Edit & resend: truncate at the edited message and replace its content.
        const idx = convo.messages.findIndex((m) => String(m._id) === String(editMessageId));
        if (idx === -1) return res.status(404).json({ error: "Message not found" });
        convo.messages.splice(idx);
      }
      convo.messages.push({ role: "user", content: message.trim(), timestamp: new Date() });
      if (convo.messages.filter((m) => m.role === "user").length === 1) {
        convo.title = store.deriveTitle(message);
      }
    }

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

    const abort = new AbortController();
    req.on("close", () => abort.abort());

    let full = "";
    let usage = null;
    const started = Date.now();
    try {
      const stream = await streamChat({ history: convo.messages, tone, signal: abort.signal });
      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          send({ type: "chunk", content: delta });
        }
        if (chunk.usage) usage = chunk.usage;
      }
    } catch (err) {
      if (!abort.signal.aborted) {
        console.error("OpenAI stream error:", err.message);
        send({ type: "error", error: "AI service error. Please try again." });
        return res.end();
      }
      // Client aborted: fall through and save what we have.
    }

    // Save the COMPLETE assistant response once.
    let messageId = null;
    if (full) {
      convo.messages.push({ role: "assistant", content: full, timestamp: new Date() });
      await store.saveConversation(convo);
      messageId = String(convo.messages[convo.messages.length - 1]._id || "");
    } else {
      await store.saveConversation(convo);
    }

    send({
      type: "done",
      messageId,
      model: MODEL,
      responseMs: Date.now() - started,
      usage: usage
        ? { prompt_tokens: usage.prompt_tokens, completion_tokens: usage.completion_tokens, total_tokens: usage.total_tokens }
        : null,
      title: convo.title
    });
    res.end();
  } catch (err) {
    next(err);
  }
}
