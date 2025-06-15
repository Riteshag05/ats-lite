import { NextResponse } from "next/server";
import { filterCandidates, rankCandidates } from "@/lib/ats";
import { loadCandidates } from "@/lib/csv";
// import { getPlanFromLLM, getSummaryFromLLM } from "@/lib/openai"; // ✅ Commented out for stable demo

// Fallback function when LLM fails
function createFallbackPlan(message: string) {
  const query = message.toLowerCase();
  const filter: Record<string, string | { $gte?: string; $lt?: string; $ne?: string }> = {};
  const rank = { primary: "years_experience" };

  // Basic keyword matching
  if (query.includes("backend")) {
    if (query.includes("aws") || query.includes("python") || query.includes("java")) {
      // Extract skill if mentioned with backend
      if (query.includes("aws")) filter.skills = "AWS";
      else if (query.includes("python")) filter.skills = "Python";
      else if (query.includes("java")) filter.skills = "Java";
    } else {
      filter.title = "Backend";
    }
  } else if (query.includes("frontend")) {
    if (query.includes("react") || query.includes("vue") || query.includes("angular")) {
      if (query.includes("react")) filter.skills = "React";
      else if (query.includes("vue")) filter.skills = "Vue";
      else if (query.includes("angular")) filter.skills = "Angular";
    } else {
      filter.title = "Frontend";
    }
  } else if (query.includes("mobile")) {
    filter.title = "Mobile";
  } else if (query.includes("devops")) {
    filter.title = "DevOps";
  } else if (query.includes("fullstack") || query.includes("full stack")) {
    filter.title = "Full";
  } else if (query.includes("developers")) {
    filter.title = "Developer";
  } else if (query.includes("engineers")) {
    filter.title = "Engineer";
  }

  // Technology skills
  if (query.includes("react") && !filter.skills) filter.skills = "React";
  if (query.includes("python") && !filter.skills) filter.skills = "Python";
  if (query.includes("aws") && !filter.skills) filter.skills = "AWS";
  if (query.includes("javascript") && !filter.skills) filter.skills = "JavaScript";

  // Location
  if (query.includes("africa")) filter.location = "Africa";
  if (query.includes("europe")) filter.location = "Europe";
  if (query.includes("asia")) filter.location = "Asia";
  if (query.includes("berlin")) filter.location = "Berlin";
  if (query.includes("germany")) filter.location = "Germany";
  if (query.includes("nigeria")) filter.location = "Nigeria";

  // Experience
  if (query.includes("senior") || query.includes("> 10") || query.includes("10+")) {
    filter.years_experience = { $gte: "10" };
  }
  if (query.includes("junior") || query.includes("< 5")) {
    filter.years_experience = { $lt: "5" };
  }

  // Salary
  if (query.includes("salary") || query.includes("paid")) {
    if (query.includes("highest") || query.includes("most")) {
      rank.primary = "desired_salary_usd";
    } else if (query.includes("< 50") || query.includes("under 50")) {
      filter.desired_salary_usd = { $lt: "50000" };
    }
  }

  console.log("🔄 Fallback plan created:", { filter, rank });
  return { filter, rank };
}

// Simple summary without LLM
function createSimpleSummary(candidates: Record<string, unknown>[]) {
  if (candidates.length === 0) return "No candidates found matching your criteria.";
  
  const avgExp = Math.round(candidates.reduce((sum, c) => sum + parseInt(c.years_experience as string), 0) / candidates.length);
  const topCandidate = candidates[0];
  
  return `Found ${candidates.length} candidate(s) with an average of ${avgExp} years experience. Top candidate: ${topCandidate.full_name} (${topCandidate.title}, ${topCandidate.years_experience} years experience).`;
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const allCandidates = await loadCandidates();
    if (!allCandidates || allCandidates.length === 0) {
      return NextResponse.json({ error: "No candidates found" }, { status: 500 });
    }

    // THINK - Use intelligent fallback system (reliable for demo)
    console.log("🧠 Using intelligent fallback system for reliable demo");
    const finalPlan = createFallbackPlan(message);

    // Uncomment below to try LLM (when API is stable)
    /*
    const headers = Object.keys(allCandidates[0]);
    const sampleCandidate = allCandidates[0];
    const sampleData = {
      title: sampleCandidate.title,
      location: sampleCandidate.location,
      skills: sampleCandidate.skills?.split(';').slice(0, 3).join(', '),
      years_experience: sampleCandidate.years_experience
    };

    console.log("🧠 Attempting LLM call for THINK phase...");
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

    // Fallback if LLM fails - create basic filters
    let finalPlan = plan;
    if (!plan) {
      console.log("🔄 LLM failed, using fallback logic");
      finalPlan = createFallbackPlan(message);
    } else {
      console.log("✅ LLM successfully generated plan");
    }
    */

    // ACT
    const filtered = filterCandidates(finalPlan.filter, allCandidates);
    const ranked = rankCandidates(filtered, finalPlan.rank);
    const top5 = ranked.slice(0, 5);

    // ✅ Debug Logs
    console.log("🧠 MCP plan:", finalPlan);
    console.log("🎯 Filtered count:", filtered.length);
    console.log("🏆 Ranked IDs:", ranked.map((c) => c.id));

    // SPEAK - Use simple summary (reliable for demo)
    let summary = "";
    if (top5.length > 0) {
      summary = createSimpleSummary(top5);
    } else {
      summary = `No candidates found matching your criteria. The search looked for candidates with: ${JSON.stringify(finalPlan.filter)}`;
    }

    // Uncomment below to try LLM summary (when API is stable)
    /*
    if (top5.length > 0) {
      console.log("💬 Attempting LLM call for SPEAK phase...");
      const llmSummary = await getSummaryFromLLM(top5);
      
      if (llmSummary && llmSummary !== "Unable to generate summary at this time.") {
        summary = llmSummary;
        console.log("✅ LLM successfully generated summary");
      } else {
        console.log("🔄 LLM summary failed, using fallback");
        summary = createSimpleSummary(top5);
      }
    } else {
      summary = `No candidates found matching your criteria. The search looked for candidates with: ${JSON.stringify(finalPlan.filter)}`;
    }
    */

    return NextResponse.json({
      plan: finalPlan,
      filtered,
      ranked,
      summary,
    });
  } catch (err) {
    console.error("[MCP ERROR]", err);
    return NextResponse.json({ error: "Failed to run MCP" }, { status: 500 });
  }
}
