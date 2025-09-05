// api/sms.ts
// Twilio posts application/x-www-form-urlencoded. We parse it, then relay to Telegram.

export const config = {
  runtime: "nodejs18.x",
};

function twiml(xml: string) {
  return new Response(xml, {
    status: 200,
    headers: { "Content-Type": "application/xml" },
  });
}

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return twiml(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
  }

  // Twilio sends x-www-form-urlencoded; parse manually
  const bodyText = await req.text();
  const params = new URLSearchParams(bodyText);

  const from = params.get("From") || "Unknown";
  const to = params.get("To") || "";
  const msg = params.get("Body") || "";

  const text = `📩 SMS to ${to}\nFrom: ${from}\n\n${msg}`;

  const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
  const telegramPayload = new URLSearchParams({
    chat_id: chatId,
    text,
    // optional: disable link previews
    disable_web_page_preview: "true",
  });

  // Fire-and-forget, but await once to surface errors in logs
  try {
    await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: telegramPayload.toString(),
    });
  } catch (e) {
    // swallow to keep Twilio happy (must respond within ~15s)
    console.error("Telegram error:", e);
  }

  // Optional auto-reply to the SMS sender (comment out if not desired)
  // return twiml(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>Thanks! Delivered to Telegram.</Message></Response>`);

  // No SMS reply
  return twiml(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
}
