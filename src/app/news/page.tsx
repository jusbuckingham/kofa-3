"use client";
import { useState } from "react";

export default function NewsPage() {
  const [q, setQ] = useState("top headlines affecting Black Americans today");
  const [out, setOut] = useState<string>("");

  const fetchNews = async () => {
    setOut("Fetching…");
    const res = await fetch("/api/agent", {
      method: "POST",
      body: JSON.stringify({ task: "news", input: q }),
    });
    const data = await res.json();
    setOut(data.output);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Agentic News</h2>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3"
        />
        <button
          onClick={fetchNews}
          className="rounded-xl border border-neutral-700 px-4 py-3"
        >
          Summarize
        </button>
      </div>
      <pre className="whitespace-pre-wrap rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm">
        {out}
      </pre>
    </div>
  );
}