/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  timeout: 10000, // 10 second timeout
});

export async function getPlanFromLLM(prompt: string) {
  try {
    console.log("🧠 Starting LLM plan generation...");
    const response = await Promise.race([
      openai.chat.completions.create({
        model: "meta-llama/llama-3.1-8b-instruct:free", // Confirmed working free model
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 200, // Reduced tokens for faster response
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("LLM timeout")), 8000) // 8 second timeout
      )
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content = (response as any).choices[0]?.message?.content;
    if (!content) throw new Error("No response from LLM");

    console.log("✅ LLM plan generated successfully");
    return JSON.parse(content);
  } catch (error) {
    console.error("❌ LLM Plan Error:", error);
    return null;
  }
}

export async function getSummaryFromLLM(candidates: Record<string, unknown>[]) {
  try {
    console.log("💬 Starting LLM summary generation...");
    const response = await Promise.race([
      openai.chat.completions.create({
        model: "meta-llama/llama-3.1-8b-instruct:free", // Confirmed working free model
        messages: [
          {
            role: "user",
            content: `Write a brief recruitment summary for these ${candidates.length} candidates. Keep it under 100 words:

${JSON.stringify(candidates.slice(0, 3), null, 2)}

Format: "Found X candidates with Y average experience. Top candidate: [name] ([title], [experience] years). Key skills include [skills]."`,
          },
        ],
        temperature: 0.3,
        max_tokens: 120, // Even stricter limit for concise summaries
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("LLM timeout")), 8000) // 8 second timeout
      )
    ]);

    console.log("✅ LLM summary generated successfully");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (response as any).choices[0]?.message?.content || "Summary unavailable";
  } catch (error) {
    console.error("❌ Summary Error:", error);
    return "Unable to generate summary at this time.";
  }
}

export async function getSmartSuggestionsFromLLM(
  currentQuery: string, 
  resultCount: number, 
  sampleCandidates: Record<string, unknown>[]
) {
  try {
    console.log("💡 Starting AI suggestion generation...");
    const response = await Promise.race([
      openai.chat.completions.create({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
          {
            role: "user",
            content: `Analyze this recruitment search and suggest exactly 3 separate, distinct queries:

Current search: "${currentQuery}"
Results found: ${resultCount} candidates
Sample candidates: ${JSON.stringify(sampleCandidates.slice(0, 2), null, 2)}

Create 3 different suggestions that are:
1. More specific than the original
2. Based on patterns in the results  
3. Each suggestion should be a complete, separate search query

Return as a valid JSON array with 3 strings:
["suggestion 1", "suggestion 2", "suggestion 3"]

CRITICAL: Return ONLY the JSON array, no markdown blocks, no explanations.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("LLM timeout")), 6000) // 6 second timeout
      )
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let content = (response as any).choices[0]?.message?.content;
    if (!content) throw new Error("No response from LLM");

    // Clean the content - remove markdown code blocks if present
    content = content.trim();
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    console.log("Raw AI response:", content);
    
    // Parse and validate the JSON
    const suggestions = JSON.parse(content.trim());
    
    // Ensure we have an array of strings
    if (!Array.isArray(suggestions)) {
      throw new Error("Response is not an array");
    }
    
    // Filter out empty strings and ensure we have valid suggestions
    const validSuggestions = suggestions
      .filter(s => typeof s === 'string' && s.trim().length > 0)
      .map(s => s.trim())
      .slice(0, 3); // Ensure max 3 suggestions
      
    if (validSuggestions.length === 0) {
      throw new Error("No valid suggestions found");
    }

    console.log("✅ AI suggestions generated successfully:", validSuggestions);
    return validSuggestions;
  } catch (error) {
    console.error("❌ Suggestions Error:", error);
    // Fallback suggestions based on current query
    return generateFallbackSuggestions(currentQuery);
  }
}

function generateFallbackSuggestions(query: string): string[] {
  const baseQuery = query.toLowerCase();
  
  // Add specific tech-based suggestions
  if (baseQuery.includes('react')) {
    return [
      "senior React developers with TypeScript",
      "React developers with Node.js experience", 
      "React developers in tech hubs (SF, NYC, Austin)"
    ];
  }
  
  if (baseQuery.includes('frontend')) {
    return [
      "senior frontend developers with React",
      "frontend developers with TypeScript experience",
      "frontend developers willing to relocate"
    ];
  }
  
  if (baseQuery.includes('backend')) {
    return [
      "senior backend engineers with microservices",
      "backend developers with cloud experience",
      "backend engineers with Python or Go"
    ];
  }
  
  if (baseQuery.includes('full') || baseQuery.includes('stack')) {
    return [
      "senior full-stack developers",
      "full-stack developers with React and Node.js",
      "full-stack developers with startup experience"
    ];
  }
  
  // Generic fallbacks
  const cleanQuery = query.replace(/\b(developer|engineer)\b/gi, '').trim();
  return [
    `senior ${cleanQuery} developers with 5+ years experience`,
    `${cleanQuery} developers willing to relocate`,
    `${cleanQuery} developers with remote work experience`
  ];
}
