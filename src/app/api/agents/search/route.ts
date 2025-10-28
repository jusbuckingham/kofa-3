const res = await fetch("/api/agents/search", {
  method: "POST",
  body: JSON.stringify({ query: q }),
});