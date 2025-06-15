import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export async function getPlanFromLLM(message: string, headers: string[]) {
  const prompt = `You are a JSON assistant. The user said:\n"${message}"\nGiven the following CSV headers:\n${headers.join(
    ", "
  )}\nRespond ONLY with valid JSON that contains:\n\n{\n  "filter": { key: "value" },\n  "rank": { "primary": "years_experience" }\n}`;

  const res = await openai.chat.completions.create({
    model: "openai/gpt-3.5-turbo", // ✅ OpenRouter model name
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });

  const content = res.choices[0].message?.content || "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);

  try {
    return JSON.parse(jsonMatch?.[0] ?? "{}");
  } catch (e) {
    console.error("❌ Invalid JSON from LLM:", content);
    return null;
  }
}

export async function getSummaryFromLLM(topCandidates: any[]) {
  const input = JSON.stringify(topCandidates, null, 2);

  const res = await openai.chat.completions.create({
   model: "openai/gpt-3.5-turbo", // ✅ OpenRouter model name
    messages: [
      { role: "system", content: "You are a helpful ATS assistant." },
      { role: "user", content: `Summarize these top candidates:\n${input}` },
    ],
  });

  return res.choices[0].message?.content || "";
}
