import "server-only";
import { Resend } from "resend";

// Sender of every invitation email (SPEC 15). The address comes from the
// CONTACT_FROM_EMAIL env var (verified domain in Resend); the display name
// is fixed branding.
const EMAIL_FROM_NAME = "OpenDayCare";

export type InvitationEmailPayload = {
  /** Recipient: the invited parent's email (lowercase). */
  to: string;
  /** Parent's full name as typed by the staff in the modal. */
  fullName: string;
  /** Name of the child the parent is being linked to. */
  childName: string;
  /** 5-char invitation code shown in the modal (same one stored in the DB). */
  code: string;
  /** Absolute URL to /activar-cuenta with the code and email prefilled. */
  activationUrl: string;
};

export type SendEmailResult =
  | { ok: true; emailId: string }
  | { ok: false; reason: string };

// Renders the invitation email with light branding: inline CSS only (Resend
// clients strip <style> in some providers), brand background #FBF4EC, coral
// gradient CTA (#F4977E → #EE8164) and the code displayed large. No complex
// logo on purpose (see spec decisions).
function renderInvitationHtml(payload: InvitationEmailPayload): string {
  const escape = (value: string): string =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const fullName = escape(payload.fullName);
  const childName = escape(payload.childName);
  const code = escape(payload.code);
  const activationUrl = escape(payload.activationUrl);

  return `
<div style="background-color:#FBF4EC;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background-color:#FBF4EC;">
    <div style="background-color:#ffffff;border:1px solid #ECE0D0;border-radius:24px;padding:40px 32px;text-align:center;">
      <div style="font-size:15px;font-weight:700;color:#3F362E;margin:0 0 16px;">OpenDayCare</div>
      <h1 style="font-size:22px;color:#3F362E;margin:0 0 8px;">Hola ${fullName},</h1>
      <p style="font-size:15px;line-height:1.6;color:#6E6359;margin:0 0 28px;">
        Te invitaron a seguir el día de <strong style="color:#3F362E;">${childName}</strong>.
        Creá tu contraseña para activar tu cuenta.
      </p>
      <div style="background-color:#FBF1D6;border:2px dashed #E6D08A;border-radius:16px;padding:20px;margin:0 0 28px;">
        <div style="font-size:11px;font-weight:800;letter-spacing:1px;color:#A88526;text-transform:uppercase;margin:0 0 8px;">Código de invitación</div>
        <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#8A7234;margin:0 0 6px;">${code}</div>
        <div style="font-size:13px;color:#A88526;">Vence en 7 días</div>
      </div>
      <a href="${activationUrl}" style="display:inline-block;background-color:#EE8164;background-image:linear-gradient(135deg,#F4977E,#EE8164);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:14px;">Activar mi cuenta</a>
      <p style="font-size:12px;line-height:1.6;color:#A89A8B;margin:24px 0 0;">
        Si el botón no funciona, copiá este enlace en tu navegador:<br>
        <span style="word-break:break-all;">${activationUrl}</span>
      </p>
    </div>
    <p style="font-size:12px;color:#A89A8B;text-align:center;margin:16px 0 0;">🌿 OpenDayCare — El día de cada niño, compartido con su familia.</p>
  </div>
</div>`.trim();
}

// Sends the invitation email. Returns a discriminated result instead of
// throwing: a failure (missing env vars, Resend error, network) leaves the
// invitation row as `pending` in the DB and the modal shows an inline retry
// message (spec decision: invitation first, email after; re-inviting
// cancels the previous row and regenerates).
export async function sendInvitationEmail(
  payload: InvitationEmailPayload,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !from) {
    return {
      ok: false,
      reason: "Faltan RESEND_API_KEY o CONTACT_FROM_EMAIL en el entorno.",
    };
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: `${EMAIL_FROM_NAME} <${from}>`,
    to: [payload.to],
    subject: `Te invitaron a OpenDayCare · código ${payload.code}`,
    html: renderInvitationHtml(payload),
  });

  if (error) {
    return { ok: false, reason: error.message ?? "Error desconocido de Resend." };
  }

  return { ok: true, emailId: data?.id ?? "" };
}
