import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[email:mock] to=${to} subject=${subject}\n${html.replace(/<[^>]+>/g, " ").trim()}`);
      return { ok: true };
    }

    throw new Error("RESEND_API_KEY manquant");
  }

  const from = process.env.EMAIL_FROM || "no-reply@onlypingtt.com";

  return resend.emails.send({
    from,
    to,
    subject,
    html
  });
}
