import OpenAI from "openai";

const TONE_INSTRUCTIONS = {
  professional: "Respond in a professional, structured and clear manner.",
  casual: "Respond in a friendly, natural and conversational manner.",
  concise: "Respond concisely and prioritize the most important information."
};

export const SUPPORTED_TONES = Object.keys(TONE_INSTRUCTIONS);
export const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

let client;
function getClient() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

// Returns an OpenAI streaming response for the given history + tone.
export async function streamChat({ history, tone, signal }) {
  const messages = [
    {
      role: "system",
      content: `You are Chatify, a helpful AI assistant. ${TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.casual}`
    },
    ...history.map((m) => ({ role: m.role, content: m.content }))
  ];

  return getClient().chat.completions.create(
    {
      model: MODEL,
      messages,
      stream: true,
      stream_options: { include_usage: true }
    },
    { signal }
  );
}
