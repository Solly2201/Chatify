// Lightweight in-memory sliding-window limiter for message requests.
// Deliberately simple (no Redis/store): protects against accidental
// rapid-fire requests, not determined abuse. A 429 from here carries
// source:"local" so it is distinguishable from an upstream provider 429
// (which never reaches the client as a 429 — it triggers the Groq fallback
// or a generic AI error inside the stream).
const WINDOW_MS = 30_000;
const MAX_REQUESTS = 10;

const hits = new Map(); // ip -> [timestamps]

setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [ip, times] of hits) {
    const fresh = times.filter((t) => t > cutoff);
    if (fresh.length) hits.set(ip, fresh);
    else hits.delete(ip);
  }
}, 60_000).unref();

export function messageRateLimit(req, res, next) {
  const ip = req.ip || "unknown";
  const now = Date.now();
  const times = (hits.get(ip) || []).filter((t) => t > now - WINDOW_MS);
  if (times.length >= MAX_REQUESTS) {
    return res.status(429).json({
      error: "Too many requests. Please wait a moment and try again.",
      source: "local"
    });
  }
  times.push(now);
  hits.set(ip, times);
  next();
}
