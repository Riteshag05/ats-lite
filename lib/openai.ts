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
