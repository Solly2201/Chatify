import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatHeader from "./components/ChatHeader";
import MessageList from "./components/MessageList";
import Composer from "./components/Composer";
import FindBar from "./components/FindBar";
import LoginScreen from "./components/LoginScreen";
import { useChat } from "./hooks/useChat";
import { countMatches } from "./services/lookup";

export default function App() {
  const [authed, setAuthed] = useState(() => localStorage.getItem("chatify_demo_auth") === "1");
  const chat = useChat();
  const [editing, setEditing] = useState(null); // message being edited
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [findActive, setFindActive] = useState(0);
  const searchRef = useRef(null);

  const findTotal = useMemo(
    () => (findQuery ? chat.messages.reduce((n, m) => n + countMatches(m.content, findQuery), 0) : 0),
    [chat.messages, findQuery]
  );
  const activeGlobal = findTotal ? Math.min(findActive, findTotal - 1) : 0;

  const closeFind = () => {
    setFindOpen(false);
    setFindQuery("");
    setFindActive(0);
  };

  // Keyboard shortcuts: Esc = close lookup / stop, Ctrl/Cmd+K = sidebar search, Ctrl/Cmd+F = find in conversation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        if (findOpen) closeFind();
        else chat.stop();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setFindOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [chat.stop, findOpen]);

  const handleSend = (text) => {
    if (editing) {
      chat.send({ message: text, editMessageId: editing._id });
      setEditing(null);
    } else {
      chat.send({ message: text });
    }
  };

  if (!authed) {
    return (
      <LoginScreen
        onLogin={() => {
          localStorage.setItem("chatify_demo_auth", "1");
          setAuthed(true);
        }}
      />
    );
  }

  return (
    <div className="h-full flex">
      <Sidebar
        onLogout={() => {
          localStorage.removeItem("chatify_demo_auth");
          setAuthed(false);
        }}
        conversations={chat.conversations}
        activeId={chat.activeId}
        onNew={() => chat.newChat(false)}
        onNewTemp={() => chat.newChat(true)}
        onOpen={chat.openConversation}
        onDelete={chat.deleteConversation}
        searchRef={searchRef}
      />
      <main className="flex-1 flex flex-col bg-ink-950 min-w-0">
        <ChatHeader
          title={chat.convoInfo?.title}
          messageCount={chat.messages.length + (chat.streaming ? 1 : 0)}
          tone={chat.tone}
          temporary={chat.temporary}
          meta={chat.meta}
          convoInfo={chat.convoInfo}
        />
        {findOpen && (
          <FindBar
            query={findQuery}
            setQuery={(q) => {
              setFindQuery(q);
              setFindActive(0);
            }}
            total={findTotal}
            activeIdx={activeGlobal}
            onNext={() => setFindActive((i) => (i + 1) % findTotal)}
            onPrev={() => setFindActive((i) => (i - 1 + findTotal) % findTotal)}
            onClose={closeFind}
          />
        )}
        <MessageList
          messages={chat.messages}
          streaming={chat.streaming}
          streamText={chat.streamText}
          meta={chat.meta}
          error={chat.error}
          onRegenerate={() => chat.send({ regenerate: true })}
          onEdit={(msg) => setEditing(msg)}
          onSuggestion={(text) => chat.send({ message: text })}
          find={findOpen && findQuery ? { query: findQuery, activeGlobal } : null}
        />
        <Composer
          onSend={handleSend}
          onStop={chat.stop}
          streaming={chat.streaming}
          tone={chat.tone}
          setTone={chat.setTone}
          editing={editing}
          cancelEdit={() => setEditing(null)}
        />
      </main>
    </div>
  );
}
