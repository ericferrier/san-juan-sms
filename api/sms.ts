// api/sms.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

function twiml(xml: string, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/xml');
  res.status(200).send(xml);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return twiml(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, res);
  }

  // Twilio posts application/x-www-form-urlencoded
  let params: URLSearchParams;
  if (typeof req.body === 'string') {
    params = new URLSearchParams(req.body);
  } else if (req.body && typeof req.body === 'object') {
    params = new URLSearchParams(Object.entries(req.body).map(([k, v]) => [k, String(v)]));
  } else {
    // fallback to raw text
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    params = new URLSearchParams(Buffer.concat(chunks).toString());
  }

  const from = params.get('From') || 'Unknown';
  const to = params.get('To') || '';
  const msg = params.get('Body') || '';

  const text = `📩 SMS to ${to}\nFrom: ${from}\n\n${msg}`;
  const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ chat_id: chatId, text, disable_web_page_preview: 'true' }).toString(),
    });
  } catch (e) {
    console.error('Telegram error:', e);
  }

  // Optional auto-reply:
  // return twiml(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>Thanks! Delivered to Telegram.</Message></Response>`, res);

  return twiml(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, res);
}
