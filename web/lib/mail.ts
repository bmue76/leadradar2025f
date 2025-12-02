// web/lib/mail.ts
import nodemailer, { SendMailOptions, Transporter } from "nodemailer";

export type BasicMailResult = {
  ok: boolean;
  error?: unknown;
};

const MAIL_ENABLED = (process.env.MAIL_ENABLED ?? "").toLowerCase() === "true";

let cachedTransporter: Transporter | null = null;

/**
 * Liefert einen Nodemailer-Transporter, falls MAIL_ENABLED true und
 * alle notwendigen ENV-Variablen gesetzt sind.
 */
function getTransporter(): Transporter | null {
  if (!MAIL_ENABLED) {
    return null;
  }

  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.MAIL_SMTP_HOST;
  const portString = process.env.MAIL_SMTP_PORT;
  const user = process.env.MAIL_SMTP_USER;
  const pass = process.env.MAIL_SMTP_PASS;

  if (!host || !portString) {
    console.warn(
      "[mail] MAIL_SMTP_HOST oder MAIL_SMTP_PORT nicht gesetzt – Mailversand deaktiviert."
    );
    return null;
  }

  const port = Number(portString) || 587;
  const secure = port === 465; // 465 = TLS/SSL, 587 = STARTTLS

  const auth =
    user && pass
      ? {
          user,
          pass,
        }
      : undefined;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth,
  });

  return cachedTransporter;
}

/**
 * Low-Level Mail-Wrapper. Wird von den spezifischen Mail-Helpern verwendet.
 */
export async function sendMail(options: SendMailOptions): Promise<BasicMailResult> {
  if (!MAIL_ENABLED) {
    console.log("[mail] MAIL_ENABLED != true – Mailversand übersprungen.", {
      to: options.to,
      subject: options.subject,
    });
    return { ok: false, error: "disabled" };
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[mail] Kein Transporter verfügbar – Mail wird nicht gesendet.");
    return { ok: false, error: "no-transporter" };
  }

  const from = options.from ?? process.env.MAIL_FROM;

  try {
    await transporter.sendMail({
      ...options,
      from,
    });

    return { ok: true };
  } catch (error) {
    console.error("[mail] Fehler beim Senden der E-Mail:", error);
    return { ok: false, error };
  }
}

// -------------------------------------------------------
// Spezifische Helfer: Danke-Mail & Innendienst-Mail
// -------------------------------------------------------

export type ThankYouMailParams = {
  to: string;
  leadId: number;
  formName?: string | null;
  eventName?: string | null;
  visitorName?: string | null;
  companyName?: string | null;
};

export async function sendThankYouMail(
  params: ThankYouMailParams
): Promise<BasicMailResult> {
  const {
    to,
    leadId,
    formName,
    eventName,
    visitorName,
    companyName,
  } = params;

  const contextEvent = eventName || formName || "unserem Messestand";
  const subject = `Vielen Dank für Ihren Besuch bei ${contextEvent}`;

  const greetingName = visitorName ? ` ${visitorName}` : "";
  const companyLine = companyName ? `\nIhr ${companyName}-Team` : "\nIhr Messe-Team";

  const text = [
    `Guten Tag${greetingName},`,
    "",
    `vielen Dank, dass Sie uns an ${contextEvent} besucht haben.`,
    "Wir melden uns in Kürze mit weiteren Informationen zu Ihrem Anliegen.",
    "",
    "Freundliche Grüsse",
    companyLine.trim(),
    "",
    `Hinweis: Diese E-Mail wurde automatisch von LeadRadar generiert (Lead-ID: ${leadId}).`,
  ].join("\n");

  const html = `
    <p>Guten Tag${greetingName},</p>
    <p>vielen Dank, dass Sie uns an <strong>${contextEvent}</strong> besucht haben.</p>
    <p>Wir melden uns in Kürze mit weiteren Informationen zu Ihrem Anliegen.</p>
    <p>Freundliche Grüsse<br/>
    ${companyName ? `Ihr <strong>${companyName}</strong>-Team` : "Ihr Messe-Team"}</p>
    <p style="font-size: 12px; color: #666;">
      Hinweis: Diese E-Mail wurde automatisch von LeadRadar generiert (Lead-ID: ${leadId}).
    </p>
  `;

  return sendMail({
    to,
    subject,
    text,
    html,
  });
}

// -------------------------------------------------------

export type LeadNotifyMailValue = {
  label: string;
  value: string | null;
};

export type LeadNotifyMailParams = {
  to?: string; // wenn nicht gesetzt, wird MAIL_LEADS_NOTIFY verwendet
  leadId: number;
  formName?: string | null;
  eventName?: string | null;
  createdAt: Date;
  values: LeadNotifyMailValue[];
};

export async function sendLeadNotifyMail(
  params: LeadNotifyMailParams
): Promise<BasicMailResult> {
  const {
    to: explicitTo,
    leadId,
    formName,
    eventName,
    createdAt,
    values,
  } = params;

  const notifyTo = explicitTo ?? process.env.MAIL_LEADS_NOTIFY;
  if (!notifyTo) {
    console.warn(
      "[mail] Kein MAIL_LEADS_NOTIFY konfiguriert – Innendienst-Mail wird nicht gesendet."
    );
    return { ok: false, error: "no-notify-address" };
  }

  const subject = `Neuer Lead von LeadRadar – ${formName || "Unbekanntes Formular"}`;

  const headerLines = [
    `Lead-ID: ${leadId}`,
    `Formular: ${formName || "-"}`,
    `Event: ${eventName || "-"}`,
    `Erfasst am: ${createdAt.toLocaleString("de-CH")}`,
  ];

  const textBody = [
    "Es wurde soeben ein neuer Lead erfasst:",
    "",
    ...headerLines,
    "",
    "Feldwerte:",
    ...values.map((v) => `- ${v.label}: ${v.value ?? ""}`),
  ].join("\n");

  const rowsHtml = values
    .map(
      (v) => `
      <tr>
        <td style="border:1px solid #ccc; padding:4px 8px;"><strong>${v.label}</strong></td>
        <td style="border:1px solid #ccc; padding:4px 8px;">${v.value ?? ""}</td>
      </tr>
    `
    )
    .join("\n");

  const htmlBody = `
    <p>Es wurde soeben ein neuer Lead erfasst:</p>
    <ul>
      <li><strong>Lead-ID:</strong> ${leadId}</li>
      <li><strong>Formular:</strong> ${formName || "-"}</li>
      <li><strong>Event:</strong> ${eventName || "-"}</li>
      <li><strong>Erfasst am:</strong> ${createdAt.toLocaleString("de-CH")}</li>
    </ul>
    <p><strong>Feldwerte:</strong></p>
    <table style="border-collapse: collapse; font-size: 14px;">
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
    <p style="font-size: 12px; color: #666;">
      Hinweis: Diese E-Mail wurde automatisch von LeadRadar generiert.
    </p>
  `;

  return sendMail({
    to: notifyTo,
    subject,
    text: textBody,
    html: htmlBody,
  });
}

// -------------------------------------------------------

/**
 * Externer Check, ob das Mailsystem grundsätzlich aktiv ist.
 */
export function isMailEnabled(): boolean {
  return MAIL_ENABLED;
}
