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

CRITICAL UNDERSTANDING:
- Job titles in our data: "Backend Engineer", "DevOps Engineer", "Frontend Engineer", "Mobile Developer", "Full-Stack Developer", "QA Engineer", "Cloud Architect", "Machine Learning Engineer", "Data Scientist", "Product Engineer"
- Skills are specific technologies like: React, Node.js, Python, AWS, Docker, etc.
- Locations are in format: "City, Country" like "Berlin, Germany"

SMART MATCHING RULES:
1. For ROLE queries:
   - "devops engineers" → {"title": "DevOps Engineer"} (exact match)
   - "backend engineers" → {"title": "Backend Engineer"} (exact match)  
   - "mobile developers" → {"title": "Mobile Developer"} (exact match)
   - "frontend engineers" → {"title": "Frontend Engineer"} (exact match)
   - "engineers" → {"title": "Engineer"} (partial match for any Engineer role)
   - "developers" → {"title": "Developer"} (partial match for any Developer role)

2. For TECHNOLOGY queries:
   - "React developers" → {"skills": "React"} (search in skills field)
   - "Python engineers" → {"skills": "Python"} (search in skills field)

3. For LOCATION queries:
   - "engineers in Germany" → {"title": "Engineer", "location": "Germany"}
   - "developers in Berlin" → {"title": "Developer", "location": "Berlin"}

4. For EXPERIENCE queries:
   - "senior engineers" → {"title": "Engineer", "years_experience": {"$gte": "5"}}

EXAMPLES:
- "devops engineers" → {"title": "DevOps Engineer"}
- "backend engineers in Germany" → {"title": "Backend Engineer", "location": "Germany"}  
- "mobile developers" → {"title": "Mobile Developer"}
- "React developers" → {"skills": "React"}
- "engineers" → {"title": "Engineer"}

Return only JSON:
{
  "filter": { /* use exact title matches when possible */ },
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
