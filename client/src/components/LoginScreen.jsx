import { useState } from "react";
import { LogIn } from "lucide-react";

// Demo access gate for the assessment — NOT real authentication.
// The preset credentials are intentionally shown on screen.
const DEMO_USER = "quantiphi";
const DEMO_PASS = "quantiphi";

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    if (username.trim() === DEMO_USER && password === DEMO_PASS) {
      onLogin();
    } else {
      setError("Invalid credentials. Use the demo account shown below.");
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="text-center mb-6">
          <div className="text-4xl text-accent ai-glow mb-2">◈</div>
          <h1 className="text-xl font-semibold text-neutral-100 tracking-tight">Chatify</h1>
          <p className="text-sm text-neutral-500 mt-1">AI Assistant</p>
        </div>

        <form onSubmit={submit} className="bg-ink-900 border border-ink-700/60 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-200">Sign in</span>
            <span className="text-[11px] text-violet-300 bg-accent-violet/10 border border-accent-violet/30 rounded-full px-2.5 py-1">
              Demo Account
            </span>
          </div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoFocus
            className="w-full bg-ink-850 border border-ink-700/60 rounded-xl px-3 py-2.5 text-sm placeholder:text-neutral-600 focus:outline-none focus:border-accent/40"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-ink-850 border border-ink-700/60 rounded-xl px-3 py-2.5 text-sm placeholder:text-neutral-600 focus:outline-none focus:border-accent/40"
          />
          {error && <div className="text-[13px] text-red-400">{error}</div>}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-soft text-white rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
          >
            <LogIn size={15} /> Log in
          </button>
        </form>

        <div className="mt-4 text-center text-[12px] text-neutral-500 leading-relaxed">
          Preset demo credentials — username <code className="text-neutral-300 bg-ink-800 px-1.5 py-0.5 rounded">quantiphi</code>{" "}
          · password <code className="text-neutral-300 bg-ink-800 px-1.5 py-0.5 rounded">quantiphi</code>
          <br />
          This is an assessment demo gate, not production authentication.
        </div>
      </div>
    </div>
  );
}
