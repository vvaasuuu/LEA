import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function fetchRecommendations({ age, conditions, priorities, scores, history }) {
  const prompt = `
You are a women's health advisor. Based on the user's profile and simulation choices, give 3 personalised next steps.

User profile:
- Age: ${age}
- Conditions: ${conditions.join(', ') || 'None'}
- Priorities: ${priorities.join(', ') || 'Not specified'}

Simulation scores:
${Object.entries(scores).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Choices made:
${history.map(h => `- Age ${h.age}: ${h.choiceLabel} → ${h.consequenceSummary}`).join('\n')}

Respond ONLY with a JSON array of exactly 3 objects, no markdown, no explanation:
[{"title": "...", "body": "..."}, ...]
`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 600,
  });

  const text = response.choices[0].message.content.trim();

  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Invalid response format');
    }
    return parsed;
  } catch {
    throw new Error('Failed to parse AI response');
  }
}