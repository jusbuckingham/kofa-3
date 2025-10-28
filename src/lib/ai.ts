import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const MODEL = "gpt-4o-mini";

/** Simple helper to call the model */
export async function chat(system: string, user: string) {
  const r = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return r.choices[0]?.message?.content ?? "";
}