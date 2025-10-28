import { NextResponse } from "next/server";
import { chat } from "@/lib/ai";
import { SYSTEM_NEWS } from "@/lib/prompts";
import { newsRss } from "@/lib/tools";

interface NewsItem {
  title?: string;
  link?: string;
  isoDate?: string;
  pubDate?: string;
}

export async function POST(req: Request) {
  try {
    const { topic } = await req.json().catch(() => ({ topic: "top headlines affecting Black Americans today" })) as { topic?: string };

    // 1) Pull items (RSS backbone for now; API providers can be added later)
    const feed = await newsRss(topic ?? "");
    const items: NewsItem[] = (feed.data?.items ?? []).slice(0, 20);

    // 2) Build a compact context list
    const lines = items.map((it, i) => {
      const d = it.isoDate ?? it.pubDate ?? "";
      const t = it.title ?? "(untitled)";
      const u = it.link ?? "";
      return `[${i + 1}] ${t} (${d}) — ${u}`;
    }).join("\n");

    const user = `Topic: ${topic ?? "headlines"}\n\nItems:\n${lines}\n\nReturn: 
- Group related items.
- Provide a compact summary with dates and [#] citations referencing the list.
- Add a brief "Why it matters for Black Americans" section at the end.
- Keep it under ~200 words.`;

    // 3) Ask the model
    const summary = await chat(SYSTEM_NEWS, user);

    return NextResponse.json({
      ok: true,
      topic: topic ?? null,
      count: items.length,
      summary,
      items: items.slice(0, 10).map((it) => ({
        title: it.title,
        url: it.link,
        date: it.isoDate ?? it.pubDate ?? null,
      })),
    });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}