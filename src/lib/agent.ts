import OpenAI from "openai";
import { z } from "zod";
import { newsRss, webFetch, webSearch, civicLookup } from "./tools";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ToolResult = z.object({
  ok: z.boolean(),
  data: z.any(),
  error: z.string().optional(),
});

type Task = "search" | "news" | "vote";

export async function agent(task: Task, input: string) {
  const sys = `You are Kofa-3, an assistant grounded in Black-conscious context.
When uncertain, search the web or fetch sources, cite them inline with titles + URLs.
Prefer clear bullet points. Avoid purple prose.`;

  const tools = {
    web_search: async (q: string) => ToolResult.parse(await webSearch(q)),
    web_fetch: async (url: string) => ToolResult.parse(await webFetch(url)),
    news_rss: async (q: string) => ToolResult.parse(await newsRss(q)),
    civic: async (addr: string) => ToolResult.parse(await civicLookup(addr)),
  } as const;

  const plan: Record<Task, string> = {
    search:
      "1) Use web_search on the query. 2) web_fetch top 1-3 results. 3) Synthesize with citations.",
    news: "1) news_rss to gather items. 2) Summarize '+ why it matters' for Black Americans, with dates.",
    vote: "1) civic lookup for elections + polling. 2) web_search for candidate sites/ballotpedia. 3) Compare stances and add logistics.",
  };

  const prompt = [
    { role: "system", content: sys },
    {
      role: "user",
      content: `Task: ${task}\nInput: ${input}\nPlan: ${plan[task]}\nReturn: a concise, cited answer.`,
    },
  ];

  if (task === "search") {
    const s = await tools.web_search(input);
    const urls = (s.data?.results || []).slice(0, 3).map((r: any) => r.url);
    const pages = await Promise.all(urls.map((u) => tools.web_fetch(u)));
    const context = pages
      .map(
        (p, i) =>
          `[${i + 1}] ${p.data?.title || urls[i]} — ${urls[i]}\n${
            p.data?.text?.slice(0, 2000) || ""
          }`
      )
      .join("\n\n");
    const out = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [...prompt, { role: "system", content: `Context:\n${context}` }],
      temperature: 0.2,
    });
    return out.choices[0].message.content;
  }

  if (task === "news") {
    const feed = await tools.news_rss(input);
    const items = (feed.data?.items || []).slice(0, 12);
    const context = items
      .map(
        (it: any, i: number) =>
          `[${i + 1}] ${it.title} (${it.isoDate}) — ${it.link}`
      )
      .join("\n");
    const out = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [...prompt, { role: "system", content: `Items:\n${context}` }],
      temperature: 0.2,
    });
    return out.choices[0].message.content;
  }

  if (task === "vote") {
    const civ = await tools.civic(input);
    const context = JSON.stringify(civ.data || {});
    const out = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [...prompt, { role: "system", content: `Civic data: ${context}` }],
      temperature: 0.2,
    });
    return out.choices[0].message.content;
  }

  return "Unknown task";
}