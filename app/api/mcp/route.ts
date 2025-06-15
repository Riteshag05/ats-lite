import { NextResponse } from "next/server";
import { filterCandidates, rankCandidates } from "@/lib/ats";
import { loadCandidates } from "@/lib/csv";
import { getPlanFromLLM, getSummaryFromLLM } from "@/lib/openai"; // ✅ Correct import

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const allCandidates = await loadCandidates();
    if (!allCandidates || allCandidates.length === 0) {
      return NextResponse.json({ error: "No candidates found" }, { status: 500 });
    }

    const headers = Object.keys(allCandidates[0]);

    // Show sample data to help LLM understand the structure
    const sampleCandidate = allCandidates[0];
    const sampleData = {
      title: sampleCandidate.title,
      location: sampleCandidate.location,
      skills: sampleCandidate.skills?.split(';').slice(0, 3).join(', '),
      years_experience: sampleCandidate.years_experience
    };

    // THINK - Enhanced prompt with better synonym handling
    const plan = await getPlanFromLLM(
      `You are creating search filters for a candidate database.

User query: "${message}"

Available fields: ${headers.join(", ")}

Sample candidate data:
${JSON.stringify(sampleData, null, 2)}

IMPORTANT GUIDELINES:
- For job roles: Use broad terms in "title" field. "dev" = "developer" = "engineer"
- For technologies: Use "skills" field (semicolon-separated: "React;Node.js;Python")  
- For locations: Use "location" field (format: "City, Country")
- For experience: Use "years_experience" with numeric operators

SYNONYM MAPPING:
- "dev", "developer", "engineer" → search title for "developer" OR "engineer"
- "backend", "back-end", "server-side" → look for backend technologies in skills
- "frontend", "front-end", "client-side" → look for frontend technologies in skills
- "fullstack", "full-end", "full stack" → title contains "Full" or "Stack"

SMART EXAMPLES:
- "backend dev" → {"title": "developer"} (matches Mobile Developer, Full-Stack Developer)
- "backend engineers" → {"title": "engineer"} (matches Backend Engineer, etc.)
- "React developers" → {"skills": "React"}
- "senior devs" → {"title": "engineer", "years_experience": {"$gte": "5"}}
- "backend dev in Germany" → {"title": "developer", "location": "Germany"}

STRATEGY: Use the BROADEST reasonable terms to maximize relevant matches.

Return only JSON:
{
  "filter": { /* use broadest matching terms */ },
  "rank": { "primary": "years_experience" }
}`,
      headers
    );

    if (!plan) throw new Error("LLM returned invalid JSON");

    // ACT
    const filtered = filterCandidates(plan.filter, allCandidates);
    const ranked = rankCandidates(filtered, plan.rank);
    const top5 = ranked.slice(0, 5);

    // ✅ Debug Logs
    console.log("🧠 MCP plan:", plan);
    console.log("🎯 Filtered count:", filtered.length);
    console.log("🏆 Ranked IDs:", ranked.map((c) => c.id));

    // SPEAK - Only generate summary if we have results
    let summary = "";
    if (top5.length > 0) {
      summary = await getSummaryFromLLM(top5);
    } else {
      summary = `No candidates found matching your criteria. The search looked for candidates with: ${JSON.stringify(plan.filter)}`;
    }

    return NextResponse.json({
      plan,
      filtered,
      ranked,
      summary,
    });
  } catch (err) {
    console.error("[MCP ERROR]", err);
    return NextResponse.json({ error: "Failed to run MCP" }, { status: 500 });
  }
}
