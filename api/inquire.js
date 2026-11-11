/**
 * Optional server path when RESEND_API_KEY is set on Vercel.
 * Browser forms use FormSubmit directly (see js/send-inquire.js) because
 * FormSubmit blocks Vercel serverless IPs via Cloudflare.
 */
const TO = "inquire@cyberequities.com";

function bad(res, status, error) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: false, error }));
}

function ok(res) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true }));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 50_000) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    bad(res, 405, "Method not allowed");
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    bad(
      res,
      501,
      "Server email is not configured. The site form sends via FormSubmit in the browser."
    );
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch (err) {
    bad(res, 400, err.message || "Bad request");
    return;
  }

  if (body.company) {
    ok(res);
    return;
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const message = String(body.message || "").trim();
  const phone = String(body.phone || "").trim();
  const offer = String(body.offer || "").trim();
  const domain = String(body.domain || "").trim();

  if (!name || !email || (!message && !offer)) {
    bad(res, 400, "Name, email, and a message or offer are required");
    return;
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

  try {
    const upstream = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "CyberEquities <onboarding@resend.dev>",
        to: [TO],
        reply_to: email,
        subject,
        text: lines.join("\n"),
      }),
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      bad(res, 502, data.message || "Could not send right now. Try again.");
      return;
    }
    ok(res);
  } catch (err) {
    bad(res, 502, err.message || "Could not send right now. Try again.");
  }
};
