import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function getPlanFromLLM(prompt: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "microsoft/phi-3-mini-128k-instruct:free",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from LLM");

    return JSON.parse(content);
  } catch (error) {
    console.error("❌ LLM Error:", error);
    return null;
  }
}

export async function getSummaryFromLLM(candidates: Record<string, unknown>[]) {
  try {
    const response = await openai.chat.completions.create({
      model: "microsoft/phi-3-mini-128k-instruct:free",
      messages: [
        {
          role: "user",
          content: `You are a helpful recruitment assistant. Based on these top candidates, write a brief, professional summary for the recruiter:

${JSON.stringify(candidates, null, 2)}

Keep it concise and highlight key insights like average experience, top skills, and notable candidates.`,
        },
      ],
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || "Summary unavailable";
  } catch (error) {
    console.error("❌ Summary Error:", error);
    return "Unable to generate summary at this time.";
  }
}
