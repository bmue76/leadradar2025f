export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

// placeholder methods – werden in 3.2 implementiert
export async function getHealth() {
  const res = await fetch(`${API_BASE_URL}/api/health`);
  return res.json();
}
