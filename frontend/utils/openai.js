// Replace with your machine's LAN IP when testing on a physical device
const API_BASE = 'http://localhost:3001/api';

export async function fetchRecommendations({ age, conditions, priorities, scores, history }) {
  const response = await fetch(`${API_BASE}/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ age, conditions, priorities, scores, history }),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.steps || [];
}
