# Chatify ◈

A dark, iMessage-inspired AI chat assistant. React frontend, Express backend, MongoDB persistence, and streamed Gemini responses (with an automatic Groq fallback).

## Features

- **Streaming AI chat** — responses stream token-by-token over SSE with a blinking cursor and a stop button
- **Tone system** — Professional / Casual / Concise / Straightforward, applied **server-side** as system instructions; tone persists per conversation
- **Conversation history** — sidebar grouped by Today / Yesterday / Earlier, with search (Ctrl/Cmd+K) and delete
- **Regenerate** — re-answer the last message with the currently selected tone
- **Edit & resend** — edit an earlier user message; the conversation is truncated and the response rebuilt
- **Temporary Chat** — kept in server memory only, never written to MongoDB
- **Auto titles** — derived from the first user message
- **Suggested follow-ups** — one-click prompts after each AI response
- **Context panel** — message count, tone, model, start time, storage mode
- **Response metadata** — model · response time · real token usage (only when the API returns it)
- **Markdown rendering** — headings, lists, inline and fenced code
- **Keyboard shortcuts** — Enter send, Shift+Enter newline, Esc stop, Ctrl/Cmd+K search

## Tech Stack

| Layer    | Tech                                              |
| -------- | ------------------------------------------------- |
| Frontend | React 18, Vite, Tailwind CSS, Lucide, React Markdown |
| Backend  | Node.js, Express, Mongoose, OpenAI SDK (Gemini + Groq via their OpenAI-compatible APIs), dotenv, cors |
| Database | MongoDB                                           |

## Architecture

```
React (Vite, :5173)
   |  REST + SSE streaming  (dev proxy /api -> :5000)
   v
Express (:5000)
   ├── conversationService ──> MongoDB (persistent chats)
   │                       └─> in-memory Map (temporary chats)
   └── aiService ────────────> Gemini (primary, OpenAI-compatible API, streaming)
                           └─> Groq   (automatic fallback on rate-limit/quota/auth/5xx)
```

- `server/src/controllers` — request handling and validation
- `server/src/services` — AI calls (tone → system instruction) and conversation storage
- `server/src/models` — Mongoose `Conversation` schema (messages embedded)
- `client/src/hooks/useChat.js` — all chat state + streaming logic
- `client/src/components` — Sidebar, ChatHeader, MessageList, MessageBubble, Composer

## Setup

Prerequisites: Node 18+, MongoDB running locally (or an Atlas URI), a Gemini API key (and optionally a Groq API key for fallback).

```bash
# Backend
cd server
npm install
cp .env.example .env   # then fill in GEMINI_API_KEY (and optionally GROQ_API_KEY)
npm run dev            # http://localhost:5000

# Frontend (separate terminal)
cd client
npm install
npm run dev            # http://localhost:5173
```

### Environment variables (`server/.env`)

```
GEMINI_API_KEY=...
MONGODB_URI=mongodb://127.0.0.1:27017/chatify
PORT=5000
GEMINI_MODEL=gemini-2.0-flash        # optional
GROQ_API_KEY=gsk_...                 # optional fallback provider
GROQ_MODEL=openai/gpt-oss-20b        # optional
```

API keys never reach the frontend; all AI calls happen server-side.

## API

| Method | Endpoint                          | Description                          |
| ------ | --------------------------------- | ------------------------------------ |
| POST   | `/api/conversations`              | Create conversation `{tone, temporary}` |
| GET    | `/api/conversations`              | List conversations (no messages)     |
| GET    | `/api/conversations/:id`          | Get one conversation with messages   |
| DELETE | `/api/conversations/:id`          | Delete a conversation                |
| POST   | `/api/conversations/:id/messages` | Send `{message, tone, regenerate?, editMessageId?}` — streams SSE events (`chunk` / `done` / `error`) |

## Design decisions

- **One message endpoint** handles send, regenerate, and edit&resend — the server truncates history appropriately, keeping branching logic in one place.
- **Complete responses only** are saved to MongoDB (one write per reply, never per token). If the user stops generation, the partial text is saved once.
- **Temporary chats** live in an in-memory `Map` on the server with the same interface as Mongo-backed chats, so the rest of the code doesn't care.
- **Tone mapping lives server-side**; the client only sends a tone id, never a system prompt.
- **Provider fallback**: Gemini is primary (via its official OpenAI-compatible endpoint, so the OpenAI SDK covers both providers); Groq takes over only when Gemini is effectively unavailable — rate limit, quota, auth errors, server errors, or the endpoint being unreachable. Both receive identical history + tone instructions, and the frontend is provider-agnostic — it just displays the model reported in the stream's `done` event.
