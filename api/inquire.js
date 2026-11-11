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

  try {
    const upstream = await fetch(`https://formsubmit.co/ajax/${TO}`, {
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
        message: lines.join("\n"),
      }),
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      bad(res, 502, data.message || "Could not send right now. Try again.");
      return;
    }

    ok(res);
  } catch {
    bad(res, 502, "Could not send right now. Try again.");
  }
};
