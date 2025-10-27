"use client";
import { useState } from "react";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [out, setOut] = useState<string>("");

  const search = async () => {
    setOut("Thinking…");
    const res = await fetch("/api/agent", {
      method: "POST",
      body: JSON.stringify({ task: "search", input: q }),
    });
    const data = await res.json();
    setOut(data.output);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Agentic Search</h2>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What do you want to know?"
          className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3"
        />
        <button
          onClick={search}
          className="rounded-xl border border-neutral-700 px-4 py-3"
        >
          Go
        </button>
      </div>
      <pre className="whitespace-pre-wrap rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm">
        {out}
      </pre>
    </div>
  );
}