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

    // THINK - Smart and flexible prompt for natural language understanding
    const plan = await getPlanFromLLM(
      `You are an intelligent search system for a candidate database. Parse the user's natural language query and create appropriate filters.

User query: "${message}"

Available fields: ${headers.join(", ")}

Sample candidate data:
${JSON.stringify(sampleData, null, 2)}

DATABASE STRUCTURE:
- Job titles: "Backend Engineer", "DevOps Engineer", "Frontend Engineer", "Mobile Developer", "Full-Stack Developer", "QA Engineer", "Cloud Architect", "Machine Learning Engineer", "Data Scientist", "Product Engineer"
- Skills: Semicolon-separated technologies like "React;Node.js;Python;AWS;Docker"
- Locations: Format "City, Country" like "Berlin, Germany" or "San Francisco, USA"
- Experience: Numeric years like "5", "10", "15"

CRITICAL UNDERSTANDING:
1. TECHNOLOGY vs JOB ROLE:
   - "React developers" = people who know React → {"skills": "React"}
   - "Python engineers" = people who know Python → {"skills": "Python"}
   - "AWS developers" = people who know AWS → {"skills": "AWS"}
   - "Node.js developers" = people who know Node.js → {"skills": "Node.js"}

2. JOB ROLES (use partial title matching):
   - "developers" → {"title": "Developer"} (matches "Mobile Developer", "Full-Stack Developer")
   - "engineers" → {"title": "Engineer"} (matches "Backend Engineer", "DevOps Engineer", etc.)
   - "backend engineers" → {"title": "Backend Engineer"} (exact match)
   - "mobile developers" → {"title": "Mobile Developer"} (exact match)

3. EXPERIENCE PARSING:
   - "less experience", "junior", "< 5 years" → {"years_experience": {"$lt": "5"}}
   - "more experience", "senior", "> 10 years" → {"years_experience": {"$gte": "10"}}
   - "5+ years", "at least 5" → {"years_experience": {"$gte": "5"}}
   - "under 3 years" → {"years_experience": {"$lt": "3"}}
   - "20 years experience" → {"years_experience": {"$gte": "20"}}
   - "most experience" → no filter, just rank by experience desc

4. LOCATION PARSING:
   - "from Berlin", "in Germany", "Berlin developers" → {"location": "Berlin"} or {"location": "Germany"}

5. COMBINATIONS:
   - "Senior React developers in Berlin" → {"skills": "React", "location": "Berlin", "years_experience": {"$gte": "5"}}

SMART EXAMPLES:
- "React developers" → {"skills": "React"} ✅
- "Python engineers" → {"skills": "Python"} ✅
- "developer with less experience" → {"title": "Developer", "years_experience": {"$lt": "5"}} ✅
- "senior backend engineers" → {"title": "Backend Engineer", "years_experience": {"$gte": "5"}} ✅
- "developers" → {"title": "Developer"} ✅
- "engineers" → {"title": "Engineer"} ✅
- "mobile dev" → {"title": "Mobile"} ✅
- "developers with most experience" → {"title": "Developer"} (rank by experience desc) ✅
- "React Native developer" → {"skills": "React"} ✅
- "AWS engineers from Berlin" → {"skills": "AWS", "location": "Berlin"} ✅

IMPORTANT RULES:
- If query mentions a TECHNOLOGY (React, Python, AWS, Node.js, etc.) → use "skills" field
- If query mentions a JOB TYPE (developer, engineer, architect) → use "title" field with partial matching
- Use partial matching for titles (don't require exact matches)
- Extract numbers and convert to appropriate operators
- Combine multiple criteria when mentioned
- Default ranking is by years_experience descending

Return only JSON:
{
  "filter": { /* smart field selection based on query type */ },
  "rank": { "primary": "years_experience" }
}`
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
