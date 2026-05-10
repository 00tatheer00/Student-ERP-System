let transporterCache = null;

async function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  if (transporterCache) return transporterCache;
  try {
    const { default: nodemailer } = await import('nodemailer');
    transporterCache = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
    return transporterCache;
  } catch {
    console.warn('[notify] nodemailer not installed — run npm i nodemailer for SMTP');
    return null;
  }
}

export async function sendNotificationEmail(to, subject, text) {
  const payload = {
    channel: 'email',
    to,
    subject,
    preview: text.slice(0, 120),
    at: new Date().toISOString(),
  };
  console.log('[notify]', JSON.stringify(payload));

  const t = await getTransport();
  if (!t || !process.env.SMTP_FROM) {
    return { queued: false, reason: 'SMTP not configured (logged only)' };
  }
  await t.sendMail({ from: process.env.SMTP_FROM, to, subject, text });
  return { queued: true };
}

export async function sendSmsStub(to, message) {
  console.log('[notify][sms-stub]', { to, message: message.slice(0, 80) });
  return { queued: false, reason: 'Configure SMS provider (Twilio etc.)' };
}

export async function sendPushStub(userId, title, body) {
  console.log('[notify][push-stub]', { userId, title, body: body.slice(0, 80) });
  return { queued: false, reason: 'Configure FCM / web push' };
}
