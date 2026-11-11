/** POST inquiry to /api/inquire */
export async function sendInquire(payload) {
  const res = await fetch("/api/inquire", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }

  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Could not send. Please try again.");
  }

  return data;
}
