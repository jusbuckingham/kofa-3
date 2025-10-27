import RSSParser from "rss-parser";
import { JSDOM } from "jsdom";
import { Readability } from "readability-js";

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
    const j = await r.json();
    return {
      ok: true,
      data: { results: j.results?.map((it: any) => ({ title: it.title, url: it.url })) },
    };
  }

  const res = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`);
  const html = await res.text();
  const dom = new JSDOM(html);
  const links = Array.from(dom.window.document.querySelectorAll("a.result__a"))
    .slice(0, 5)
    .map((a: any) => ({ title: a.textContent?.trim(), url: a.href }));
  return { ok: true, data: { results: links } };
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
  } catch (e: any) {
    return { ok: false, data: null, error: String(e) };
  }
}

// NEWS via RSS
export async function newsRss(_q: string) {
  const parser = new RSSParser();
  const sources = process.env.NEWS_RSS_SOURCES
    ? JSON.parse(process.env.NEWS_RSS_SOURCES)
    : [
        "https://www.theguardian.com/us-news/rss",
        "https://rss.nytimes.com/services/xml/rss/nyt/US.xml",
        "https://www.npr.org/rss/rss.php?id=1004",
      ];
  const feeds = await Promise.allSettled(sources.map((u) => parser.parseURL(u)));
  const items = feeds
    .flatMap((res: any) => res.value?.items || [])
    .sort(
      (a: any, b: any) =>
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