import OpenAI from "openai";

const TONE_INSTRUCTIONS = {
  professional: "Respond in a professional, structured and clear manner.",
  casual: "Respond in a friendly, natural and conversational manner.",
  concise: "Respond concisely and prioritize the most important information."
};

export const SUPPORTED_TONES = Object.keys(TONE_INSTRUCTIONS);
export const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

// Both providers expose OpenAI-compatible APIs, so one SDK covers both.
let geminiClient, groqClient;
function getGemini() {
  if (!geminiClient) {
    geminiClient = new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    });
  }
  return geminiClient;
}
function getGroq() {
  if (!groqClient) {
    groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    });
  }
  return groqClient;
}

// Fall back only when the primary is effectively unavailable: rate limit,
// quota, auth (bad/missing key), not-found, server errors, or no HTTP
// response at all (network/proxy failure).
function isFallbackWorthy(err) {
  const status = err?.status || err?.response?.status;
  return status === 429 || status === 401 || status === 403 || status === 404 || (status >= 500 && status < 600) || err?.code === "insufficient_quota" || !status;
}

function buildMessages(history, tone) {
  return [
    {
      role: "system",
      content: `You are Chatify, a helpful AI assistant. ${TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.casual}`
    },
    ...history.map((m) => ({ role: m.role, content: m.content }))
  ];
}

// Returns { stream, model, provider }: Gemini first, Groq when Gemini fails
// with a fallback-worthy error and GROQ_API_KEY is configured.
export async function streamChat({ history, tone, signal }) {
  const messages = buildMessages(history, tone);
  const request = (client, model) =>
    client.chat.completions.create(
      { model, messages, stream: true, stream_options: { include_usage: true } },
      { signal }
    );

  try {
    const stream = await request(getGemini(), MODEL);
    return { stream, model: MODEL, provider: "gemini" };
  } catch (err) {
    if (process.env.GROQ_API_KEY && isFallbackWorthy(err) && !signal?.aborted) {
      console.warn(`Gemini unavailable (${err.status || err.code || err.message}), falling back to Groq`);
      const stream = await request(getGroq(), GROQ_MODEL);
      return { stream, model: GROQ_MODEL, provider: "groq" };
    }
    throw err;
  }
}
