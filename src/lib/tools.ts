/// <reference types="node" />

// Local helper types to avoid `any`
type SearchResult = { title: string; url: string };
interface RssItem { title?: string; link?: string; isoDate?: string; pubDate?: string }
type ParsedFeed = { items?: RssItem[] };

import RSSParser from "rss-parser";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

// SEARCH (Tavily optional)
export async function webSearch(q: string) {
  if (process.env.TAVILY_API_KEY) {
    const r = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({ query: q, max_results: 5, include_answer: false }),
    });
    type TavilyItem = { title?: string; url?: string };
    type TavilyResponse = { results?: TavilyItem[] };
    const j = (await r.json()) as TavilyResponse;
    const results: SearchResult[] = (j.results ?? []).map((it) => ({
      title: it.title ?? "",
      url: it.url ?? "",
    }));
    return { ok: true, data: { results } };
  }

  const res = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`);
  const html = await res.text();
  const dom = new JSDOM(html);
  const anchors = Array.from(
    dom.window.document.querySelectorAll<HTMLAnchorElement>("a.result__a")
  )
    .slice(0, 5)
    .map((a) => ({ title: a.textContent?.trim() ?? "", url: a.href }));
  return { ok: true, data: { results: anchors as SearchResult[] } };
}

// FETCH & EXTRACT
export async function webFetch(url: string) {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "kofa-3/0.1 (+https://kofa.ai)" },
    });
    const html = await r.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    return { ok: true, data: { title: article?.title, text: article?.textContent } };
  } catch (e: unknown) {
    return { ok: false, data: null, error: String(e) };
  }
}

// NEWS via RSS
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function newsRss(_q: string) {
  const parser = new RSSParser();
  const sources = process.env.NEWS_RSS_SOURCES
    ? JSON.parse(process.env.NEWS_RSS_SOURCES)
    : [
        "https://www.theguardian.com/us-news/rss",
        "https://rss.nytimes.com/services/xml/rss/nyt/US.xml",
        "https://www.npr.org/rss/rss.php?id=1004",
      ];
  const feedPromises = sources.map((u: string) => parser.parseURL(u) as unknown as Promise<ParsedFeed>);
  const feeds = await Promise.allSettled(feedPromises);
  const items: RssItem[] = feeds
    .flatMap((res) => (res.status === "fulfilled" ? res.value.items ?? [] : []))
    .sort((a, b) =>
      new Date(b.isoDate || b.pubDate || 0).getTime() -
      new Date(a.isoDate || a.pubDate || 0).getTime()
    );
  return { ok: true, data: { items } };
}

// VOTE: Google Civic Info
export async function civicLookup(address: string) {
  if (!process.env.CIVIC_API_KEY) {
    return {
      ok: true,
      data: { note: "No CIVIC_API_KEY provided. Add one to enable ballot & polling." },
    };
  }
  const url = `https://civicinfo.googleapis.com/civicinfo/v2/voterinfo?address=${encodeURIComponent(
    address
  )}&key=${process.env.CIVIC_API_KEY}`;
  const r = await fetch(url);
  const j = await r.json();
  return { ok: true, data: j };
}