"use client";
import { useState } from "react";

export default function VotePage() {
  const [addr, setAddr] = useState("4435 11th Ave, Los Angeles, CA 90043");
  const [out, setOut] = useState<string>("");

  const fetchVote = async () => {
    setOut("Looking up…");
    const res = await fetch("/api/agent", {
      method: "POST",
      body: JSON.stringify({ task: "vote", input: addr }),
    });
    const data = await res.json();
    setOut(data.output);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Agentic Vote</h2>
      <div className="flex gap-2">
        <input
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3"
        />
        <button
          onClick={fetchVote}
          className="rounded-xl border border-neutral-700 px-4 py-3"
        >
          Get Ballot & Guidance
        </button>
      </div>
      <pre className="whitespace-pre-wrap rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm">
        {out}
      </pre>
    </div>
  );
}