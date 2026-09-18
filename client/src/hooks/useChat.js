import { useCallback, useEffect, useRef, useState } from "react";
import { api, streamMessage } from "../services/api";

export const TONES = [
  { id: "professional", label: "Professional", hint: "Structured and formal" },
  { id: "casual", label: "Casual", hint: "Friendly and conversational" },
  { id: "concise", label: "Concise", hint: "Short and direct" },
  { id: "straightforward", label: "Straightforward", hint: "Candid and factual" }
];

export function useChat() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tone, setTone] = useState("casual");
  const [temporary, setTemporary] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [meta, setMeta] = useState(null); // last response metadata
  const [convoInfo, setConvoInfo] = useState(null); // {title, createdAt, temporary}
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const refreshList = useCallback(async () => {
    try {
      setConversations(await api.listConversations());
    } catch {
      /* list refresh is non-critical */
    }
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  const newChat = useCallback((isTemp = false) => {
    abortRef.current?.abort();
    setActiveId(null);
    setMessages([]);
    setMeta(null);
    setConvoInfo(null);
    setError(null);
    setStreaming(false);
    setStreamText("");
    setTemporary(isTemp);
  }, []);

  const openConversation = useCallback(async (id) => {
    abortRef.current?.abort();
    setError(null);
    setStreaming(false);
    setStreamText("");
    setMeta(null);
    try {
      const convo = await api.getConversation(id);
      setActiveId(convo._id);
      setMessages(convo.messages);
      setTone(convo.tone || "casual");
      setTemporary(!!convo.temporary);
      setConvoInfo({ title: convo.title, createdAt: convo.createdAt, temporary: convo.temporary });
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const deleteConversation = useCallback(
    async (id) => {
      await api.deleteConversation(id).catch(() => {});
      if (id === activeId) newChat(false);
      refreshList();
    },
    [activeId, newChat, refreshList]
  );

  // Single send path for new messages, regenerate, and edit&resend — the
  // server owns the matching history truncation for the latter two.
  const send = useCallback(
    async ({ message, regenerate = false, editMessageId = null } = {}) => {
      if (streaming) return;
      setError(null);

      let convId = activeId;
      let created = null;
      if (!convId) {
        try {
          created = await api.createConversation({ tone, temporary });
          convId = created._id;
          setActiveId(convId);
          setConvoInfo({ title: created.title, createdAt: created.createdAt, temporary });
        } catch (err) {
          setError(err.message);
          return;
        }
      }

      setMessages((prev) => {
        let next = [...prev];
        if (regenerate) {
          while (next.length && next[next.length - 1].role === "assistant") next.pop();
        } else {
          if (editMessageId) {
            const idx = next.findIndex((m) => String(m._id) === String(editMessageId));
            if (idx !== -1) next = next.slice(0, idx);
          }
          next.push({ role: "user", content: message, timestamp: new Date().toISOString(), _id: "local_" + Date.now() });
        }
        return next;
      });

      setStreaming(true);
      setStreamText("");
      setMeta(null);
      const abort = new AbortController();
      abortRef.current = abort;
      let acc = "";

      await streamMessage(
        convId,
        { message, tone, regenerate, editMessageId },
        {
          signal: abort.signal,
          onChunk: (text) => {
            acc += text;
            setStreamText(acc);
          },
          onDone: (event) => {
            setMeta(event);
            if (event.title) setConvoInfo((info) => ({ ...(info || {}), title: event.title }));
          },
          onError: (err) => setError(err.message)
        }
      );

      setStreaming(false);
      setStreamText("");
      if (acc) {
        setMessages((prev) => [...prev, { role: "assistant", content: acc, timestamp: new Date().toISOString(), _id: "a_" + Date.now() }]);
      }
      refreshList();
      // Re-sync from server so message _ids are real (needed for edit).
      if (convId) {
        api.getConversation(convId).then((c) => setMessages(c.messages)).catch(() => {});
      }
    },
    [activeId, tone, temporary, streaming, refreshList]
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  return {
    conversations,
    activeId,
    messages,
    tone,
    setTone,
    temporary,
    streaming,
    streamText,
    meta,
    convoInfo,
    error,
    setError,
    newChat,
    openConversation,
    deleteConversation,
    send,
    stop,
    refreshList
  };
}
