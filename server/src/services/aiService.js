import OpenAI from "openai";

const TONE_INSTRUCTIONS = {
  professional: "Respond in a professional, structured and clear manner.",
  casual: "Respond in a friendly, natural and conversational manner.",
  concise: "Respond concisely and prioritize the most important information."
};

export const SUPPORTED_TONES = Object.keys(TONE_INSTRUCTIONS);
export const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

let openaiClient, groqClient;
function getOpenAI() {
  if (!openaiClient) openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openaiClient;
}
// Groq exposes an OpenAI-compatible API, so the same SDK works with a different baseURL.
function getGroq() {
  if (!groqClient) {
    groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    });
  }
  return groqClient;
}

// Temporary provider failures worth falling back on: rate limit, quota, server errors, connectivity.
function isFallbackWorthy(err) {
  const status = err?.status || err?.response?.status;
  // 401 counts too: an invalid/missing key makes OpenAI effectively unavailable.
  return status === 429 || status === 401 || (status >= 500 && status < 600) || err?.code === "insufficient_quota" || !status;
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

// Returns { stream, model, provider }. Tries OpenAI first; falls back to Groq
// on rate-limit/quota/temporary failures when GROQ_API_KEY is configured.
export async function streamChat({ history, tone, signal }) {
  const messages = buildMessages(history, tone);
  const request = (client, model) =>
    client.chat.completions.create(
      { model, messages, stream: true, stream_options: { include_usage: true } },
      { signal }
    );

  try {
    const stream = await request(getOpenAI(), MODEL);
    return { stream, model: MODEL, provider: "openai" };
  } catch (err) {
    if (process.env.GROQ_API_KEY && isFallbackWorthy(err) && !signal?.aborted) {
      console.warn(`OpenAI unavailable (${err.status || err.code || err.message}), falling back to Groq`);
      const stream = await request(getGroq(), GROQ_MODEL);
      return { stream, model: GROQ_MODEL, provider: "groq" };
    }
    throw err;
  }
}
