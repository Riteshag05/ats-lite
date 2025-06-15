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
      `You are an advanced AI recruiter that understands complex natural language queries. Parse any query and create intelligent filters.

User query: "${message}"

Available fields: ${headers.join(", ")}

Sample candidate data:
${JSON.stringify(sampleData, null, 2)}

EXACT JOB TITLES IN OUR DATABASE:
- "Backend Engineer" (NOT "Backend Developer")
- "Frontend Engineer" (NOT "Frontend Developer") 
- "DevOps Engineer"
- "QA Engineer"
- "Machine Learning Engineer"
- "Product Engineer"
- "Mobile Developer"
- "Full‑Stack Developer" (with en-dash ‑, NOT hyphen -)
- "Cloud Architect"
- "Data Scientist"

CRITICAL JOB TITLE MAPPING:
1. BACKEND QUERIES:
   - "backend developers", "backend devs", "backend engineers" → {"title": "Backend"}
   - "backend" → {"title": "Backend"}

2. FRONTEND QUERIES:
   - "frontend developers", "frontend devs", "frontend engineers" → {"title": "Frontend"}
   - "frontend" → {"title": "Frontend"}

3. FULLSTACK QUERIES:
   - "fullstack developers", "full stack developers", "full-stack developers" → {"title": "Full"}
   - "fullstack", "full stack" → {"title": "Full"}

4. MOBILE QUERIES:
   - "mobile developers", "mobile devs", "mobile engineers" → {"title": "Mobile"}
   - "mobile" → {"title": "Mobile"}

5. DEVOPS QUERIES:
   - "devops engineers", "devops developers", "devops" → {"title": "DevOps"}

6. GENERIC QUERIES:
   - "developers" → {"title": "Developer"} (matches Mobile Developer, Full‑Stack Developer)
   - "engineers" → {"title": "Engineer"} (matches all Engineer titles)
   - "architects" → {"title": "Architect"}
   - "scientists" → {"title": "Scientist"}

7. TECHNOLOGY SKILLS:
   - "React developers" → {"skills": "React"}
   - "Python engineers" → {"skills": "Python"}
   - "AWS experts" → {"skills": "AWS"}

8. EXPERIENCE PARSING:
   - "1 or 5 years" → {"years_experience": {"$in": ["1", "5"]}}
   - "less than 5 years", "junior", "< 5" → {"years_experience": {"$lt": "5"}}
   - "more than 10 years", "senior", "> 10" → {"years_experience": {"$gte": "10"}}
   - "between 5 and 10 years" → {"years_experience": {"$gte": "5", "$lte": "10"}}
   - "exactly 20 years" → {"years_experience": {"$eq": "20"}}

9. LOCATION INTELLIGENCE:
   - "from Australia", "in Berlin" → {"location": "Australia"}, {"location": "Berlin"}

10. WORK PREFERENCES:
    - "remote workers" → {"work_preference": "Remote"}
    - "onsite candidates" → {"work_preference": "Onsite"}

11. AVAILABILITY:
    - "available immediately" → {"notice_period_weeks": "0"}
    - "resigned recently" → {"notice_period_weeks": {"$lte": "2"}}

SMART EXAMPLES:
- "backend developers" → {"title": "Backend"} ✅
- "frontend engineers" → {"title": "Frontend"} ✅  
- "fullstack developers" → {"title": "Full"} ✅
- "mobile devs" → {"title": "Mobile"} ✅
- "software developers" → {"title": "Developer"} ✅
- "sde" → {"title": "Engineer"} ✅
- "React developers" → {"skills": "React"} ✅
- "senior backend engineers" → {"title": "Backend", "years_experience": {"$gte": "10"}} ✅
- "remote python developers" → {"skills": "Python", "work_preference": "Remote"} ✅

CRITICAL RULES:
- Use PARTIAL matching for titles (Backend matches "Backend Engineer")
- Developer/Engineer are interchangeable in queries but map to our exact titles
- Handle character variations (hyphen vs en-dash)
- Extract ALL criteria from complex queries
- Default ranking by years_experience descending

Return only JSON:
{
  "filter": { /* intelligent multi-criteria filtering */ },
  "rank": { "primary": "years_experience" /* or other field based on query */ }
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
