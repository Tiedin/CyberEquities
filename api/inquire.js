const TO = "inquire@cyberequities.com";
const SITE = "https://cyberequities.com";

function bad(res, status, error) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: false, error }));
}

function ok(res, extra = {}) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true, ...extra }));
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

function isTruthySuccess(data) {
  return data && (data.success === true || data.success === "true");
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

  let body;
  try {
    body = await readBody(req);
  } catch (err) {
    bad(res, 400, err.message || "Bad request");
    return;
  }

  // Honeypot — bots fill this; humans never see it
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

  if (!name || !email) {
    bad(res, 400, "Name and email are required");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    bad(res, 400, "Enter a valid email");
    return;
  }

  if (!message && !offer) {
    bad(res, 400, "Add a short message or offer");
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

  // Prefer Resend when configured; otherwise FormSubmit
  if (process.env.RESEND_API_KEY) {
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
      return;
    } catch {
      bad(res, 502, "Could not send right now. Try again.");
      return;
    }
  }

  try {
    const upstream = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(TO)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: SITE,
        Referer: `${SITE}/`,
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

    const data = await upstream.json().catch(() => ({}));
    const msg = String(data.message || "");

    if (!upstream.ok || data.success === false || data.success === "false") {
      if (/activat/i.test(msg)) {
        bad(
          res,
          503,
          "Inbox setup pending: open inquire@cyberequities.com and click FormSubmit’s Activate Form link, then try again."
        );
        return;
      }
      bad(res, 502, msg || "Could not send right now. Try again.");
      return;
    }

    if (!isTruthySuccess(data) && !msg.toLowerCase().includes("thank")) {
      // Some FormSubmit responses only return a thank-you string
      bad(res, 502, msg || "Could not send right now. Try again.");
      return;
    }

    ok(res);
  } catch {
    bad(res, 502, "Could not send right now. Try again.");
  }
};
