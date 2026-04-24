const express = require('express');
const OpenAI = require('openai');

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/recommendations', async (req, res) => {
  const { age, conditions, priorities, scores, history } = req.body;

  const conditionText =
    conditions?.filter(c => c !== 'None' && c !== 'Prefer not to say').join(', ') ||
    'none reported';
  const priorityText = priorities?.join(', ') || 'not specified';
  const historyText =
    history
      ?.map(h => `Age ${h.age}: "${h.choiceLabel}" — ${h.consequenceSummary}`)
      .join('\n') || 'no choices recorded';

  const prompt = `You are a warm, knowledgeable women's health advisor. A user just completed a fertility and career planning simulation. Based on their real profile and the choices they made, give them 4 personalised, actionable next steps they can take in real life.

User profile:
- Age: ${age || 'not provided'}
- Health conditions: ${conditionText}
- Life priorities: ${priorityText}

Simulation scores (out of 50):
- Fertility awareness: ${scores?.fertility ?? 0}
- Career: ${scores?.career ?? 0}
- Health: ${scores?.health ?? 0}
- Relationships: ${scores?.relationship ?? 0}

Choices made during the simulation:
${historyText}

Respond with ONLY valid JSON in this exact structure, no extra text:
{ "steps": [ { "title": "short action title (5-8 words)", "body": "1-2 sentence explanation" } ] }

Include exactly 4 steps. Be warm, non-judgmental, practical, and specific to their scores and conditions.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 900,
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    const steps = parsed.steps || [];
    res.json({ steps });
  } catch (err) {
    console.error('OpenAI error:', err.message);
    res.status(500).json({ error: 'AI request failed' });
  }
});

module.exports = router;
