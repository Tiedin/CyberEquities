const TO = "inquire@cyberequities.com";

/**
 * Send inquiry email via FormSubmit from the browser.
 * (Vercel serverless IPs are blocked by FormSubmit’s Cloudflare challenge.)
 */
export async function sendInquire(payload) {
  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim();
  const message = String(payload.message || "").trim();
  const phone = String(payload.phone || "").trim();
  const offer = String(payload.offer || "").trim();
  const domain = String(payload.domain || "").trim();
  const company = String(payload.company || "").trim();

  // Honeypot
  if (company) return { ok: true };

  if (!name || !email) {
    throw new Error("Name and email are required");
  }
  if (!message && !offer) {
    throw new Error("Add a short message or offer");
  }

  const subject = domain
    ? `Offer: ${domain}`
    : "Private inquiry — CyberEquities";

  const lines = [
    domain ? `Domain: ${domain}` : null,
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    offer ? `Offer (USD): ${offer}` : null,
    message ? `Message:\n${message}` : null,
  ].filter(Boolean);

  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(TO)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name,
      email,
      _replyto: email,
      _subject: subject,
      _template: "table",
      message: lines.join("\n"),
    }),
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }

  const msg = String(data.message || "");

  if (/activat/i.test(msg)) {
    throw new Error(
      "Almost ready: check inquire@cyberequities.com for FormSubmit’s Activate Form email, click it once, then submit again."
    );
  }

  if (!res.ok || data.success === false || data.success === "false") {
    throw new Error(msg || "Could not send. Please try again.");
  }

  return { ok: true };
}
