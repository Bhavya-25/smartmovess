import nodemailer, { type Transporter } from "nodemailer";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const prettyKey = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

let transporter: Transporter | null = null;

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  transporter ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 465),
    secure: Number(SMTP_PORT ?? 465) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    // Fail fast on a wrong host/port so the form never hangs on mail problems.
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 15000,
  });
  return transporter;
}

/**
 * Emails a form entry to the team inbox. Returns true if the mail was sent.
 * Never throws; the caller decides what to show the user on failure.
 */
export async function sendFormNotification(form: string, data: Record<string, unknown>): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    console.error("[mailer] SMTP is not configured (SMTP_HOST / SMTP_USER / SMTP_PASS)");
    return false;
  }

  const entries = Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== "");
  const text = [`New submission from: ${form}`, "", ...entries.map(([k, v]) => `${prettyKey(k)}: ${String(v)}`)].join("\n");
  const rows = entries
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;font-weight:600;vertical-align:top">${escapeHtml(prettyKey(k))}</td><td style="padding:6px 12px">${escapeHtml(String(v)).replace(/\n/g, "<br>")}</td></tr>`,
    )
    .join("");

  const replyTo = typeof data.email === "string" ? data.email : undefined;

  try {
    await t.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: process.env.NOTIFY_EMAIL || "info@smartmovess.co.in",
      replyTo,
      subject: `[SmartMoves] New ${form} entry`,
      text,
      html: `<h2 style="font-family:sans-serif">New submission: ${escapeHtml(form)}</h2><table style="font-family:sans-serif;border-collapse:collapse">${rows}</table>`,
    });
    return true;
  } catch (e) {
    console.error("[mailer] failed to send notification", e);
    return false;
  }
}
