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

DATABASE SCHEMA:
- Job titles: "Backend Engineer", "DevOps Engineer", "Frontend Engineer", "Mobile Developer", "Full-Stack Developer", "QA Engineer", "Cloud Architect", "Machine Learning Engineer", "Data Scientist", "Product Engineer"
- Skills: Semicolon-separated like "React;Node.js;Python;AWS;Docker"
- Locations: "City, Country" format like "Berlin, Germany", "Sydney, Australia"
- Experience: Numeric years as strings like "5", "10", "15"
- Work preferences: "Remote", "Hybrid", "Onsite"
- Notice period: Weeks as strings like "0", "2", "4"

ADVANCED QUERY UNDERSTANDING:

1. ROLE INTELLIGENCE:
   - "developers" → {"title": "Developer"} (matches Mobile Developer, Full-Stack Developer)
   - "engineers" → {"title": "Engineer"} (matches Backend Engineer, DevOps Engineer, etc.)
   - "architects" → {"title": "Architect"} (matches Cloud Architect)
   - "scientists" → {"title": "Scientist"} (matches Data Scientist)

2. TECHNOLOGY SKILLS:
   - "React developers" → {"skills": "React"}
   - "Python engineers" → {"skills": "Python"}
   - "Kubernetes experience" → {"skills": "Kubernetes"}
   - "AWS experts" → {"skills": "AWS"}

3. EXPERIENCE PARSING:
   - "1 or 5 years" → {"years_experience": {"$in": ["1", "5"]}}
   - "less than 5 years", "junior", "< 5" → {"years_experience": {"$lt": "5"}}
   - "more than 10 years", "senior", "> 10" → {"years_experience": {"$gte": "10"}}
   - "5+ years", "at least 5" → {"years_experience": {"$gte": "5"}}
   - "exactly 3 years" → {"years_experience": {"$eq": "3"}}
   - "between 5 and 10 years" → {"years_experience": {"$gte": "5", "$lte": "10"}}

4. LOCATION INTELLIGENCE:
   - "from Australia" → {"location": "Australia"}
   - "in Berlin" → {"location": "Berlin"}
   - "developers from australia" → {"title": "Developer", "location": "Australia"}

5. WORK PREFERENCES:
   - "remote workers" → {"work_preference": "Remote"}
   - "onsite candidates" → {"work_preference": "Onsite"}
   - "hybrid workers" → {"work_preference": "Hybrid"}

6. AVAILABILITY & URGENCY:
   - "resigned recently", "available immediately" → {"notice_period_weeks": {"$lte": "2"}}
   - "can start soon" → {"notice_period_weeks": {"$lte": "4"}}
   - "long notice period" → {"notice_period_weeks": {"$gte": "8"}}

7. COMPLEX COMBINATIONS:
   - "senior React developers in Berlin" → {"skills": "React", "location": "Berlin", "years_experience": {"$gte": "5"}}
   - "remote kubernetes engineers with 10+ years" → {"skills": "Kubernetes", "title": "Engineer", "work_preference": "Remote", "years_experience": {"$gte": "10"}}

8. SMART RANKING:
   - "most experienced" → rank by years_experience desc
   - "recently active" → rank by last_active desc  
   - "available soonest" → rank by notice_period_weeks asc
   - "highest salary" → rank by desired_salary_usd desc

EXAMPLES:
- "berlin engineers with 1 or 5 years of experience" → {"title": "Engineer", "location": "Berlin", "years_experience": {"$in": ["1", "5"]}}
- "developers from australia" → {"title": "Developer", "location": "Australia"}
- "scientists who know python" → {"title": "Scientist", "skills": "Python"}
- "candidates who resigned recently" → {"notice_period_weeks": {"$lte": "2"}}
- "remote workers with kubernetes experience" → {"work_preference": "Remote", "skills": "Kubernetes"}
- "architects in cyprus with 15+ years" → {"title": "Architect", "location": "Cyprus", "years_experience": {"$gte": "15"}}
- "senior fullstack developers willing to relocate" → {"title": "Full-Stack Developer", "years_experience": {"$gte": "5"}, "willing_to_relocate": "Yes"}

INTELLIGENCE RULES:
- Extract ALL relevant criteria from the query
- Use partial matching for job titles
- Combine multiple conditions when mentioned
- Handle synonyms and natural language variations
- Default ranking is by years_experience descending
- Be flexible with location matching (city or country)
- Understand urgency and availability context

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
