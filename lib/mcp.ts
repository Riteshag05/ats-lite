'use client';

import { useATSStore } from "@/store/useATSStore";

export async function runMCP(message: string) {
  const {
    setFiltered,
    setRanked,
    setPlan,
    setSummary,
    setSuggestions,
    setLoading,
  } = useATSStore.getState();

  setLoading(true);

  try {
    const res = await fetch("/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) throw new Error("API call failed");

    const { plan, filtered, ranked, summary, suggestions } = await res.json();

    setPlan(plan);
    setFiltered(filtered);
    setRanked(ranked);
    setSummary(summary);
    setSuggestions(suggestions || []);
  } catch (e) {
    console.error("runMCP error", e);
    setSummary("❌ LLM processing failed.");
    setSuggestions([]);
  } finally {
    setLoading(false);
  }
}
