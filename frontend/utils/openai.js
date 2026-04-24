// Replace with your machine's LAN IP when testing on a physical device
const API_BASE = 'http://192.168.1.42:3001/api';
const TIMEOUT_MS = 30000;

export async function fetchRecommendations({ age, conditions, priorities, scores, history }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ age, conditions, priorities, scores, history }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Server error ${response.status}: ${body}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.steps) || data.steps.length === 0) {
      throw new Error('Empty steps returned from server');
    }
    return data.steps;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out after 30 seconds — is the backend running?');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
