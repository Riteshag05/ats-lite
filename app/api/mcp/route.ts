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
      `Parse this query and create filters for a candidate database.

Query: "${message}"

Fields: ${headers.join(", ")}

Job titles: Backend Engineer, Frontend Engineer, DevOps Engineer, QA Engineer, Machine Learning Engineer, Product Engineer, Mobile Developer, Full‑Stack Developer, Cloud Architect, Data Scientist

RULES:
- "backend developers" → {"title": "Backend"}
- "backend engineers with AWS" → {"skills": "AWS"} (skill only)
- "frontend developers" → {"title": "Frontend"}  
- "mobile developers" → {"title": "Mobile"}
- "developers" → {"title": "Developer"}
- "engineers" → {"title": "Engineer"}
- "React developers" → {"skills": "React"}
- "AWS engineers" → {"skills": "AWS"}
- "Africa" → {"location": "Africa"}
- "Berlin" → {"location": "Berlin"}
- "salary < 50k" → {"desired_salary_usd": {"$lt": "50000"}}
- "senior" → {"years_experience": {"$gte": "10"}}

Return JSON:
{"filter": {}, "rank": {"primary": "years_experience"}}`
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
