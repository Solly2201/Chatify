import { useEffect, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatHeader from "./components/ChatHeader";
import MessageList from "./components/MessageList";
import Composer from "./components/Composer";
import { useChat } from "./hooks/useChat";

export default function App() {
  const chat = useChat();
  const [editing, setEditing] = useState(null); // message being edited
  const searchRef = useRef(null);

  // Keyboard shortcuts: Esc = stop, Ctrl/Cmd+K = focus search
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") chat.stop();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [chat.stop]);

  const handleSend = (text) => {
    if (editing) {
      chat.send({ message: text, editMessageId: editing._id });
      setEditing(null);
    } else {
      chat.send({ message: text });
    }
  };

  return (
    <div className="h-full flex">
      <Sidebar
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
        <MessageList
          messages={chat.messages}
          streaming={chat.streaming}
          streamText={chat.streamText}
          meta={chat.meta}
          error={chat.error}
          onRegenerate={() => chat.send({ regenerate: true })}
          onEdit={(msg) => setEditing(msg)}
          onSuggestion={(text) => chat.send({ message: text })}
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
