import { Resend } from 'resend';

// Default from email - customize this for your domain
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Xytex <noreply@xytex.dev>';

// Lazy initialization - only create Resend client when needed
let resendInstance: Resend | null = null;

function getResendClient(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured');
    throw new Error('Email service is not configured');
  }

  const { to, subject, html, text, replyTo } = options;

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      replyTo,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(error.message);
    }

    console.log('Email sent successfully:', data?.id);
    return data;
  } catch (error: any) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export interface InvitationEmailData {
  email: string;
  inviteLink: string;
  role: string;
  invitedByName?: string;
  expiresAt: string;
}

export async function sendInvitationEmail(data: InvitationEmailData) {
  const { email, inviteLink, role, invitedByName, expiresAt } = data;
  
  const roleDisplay = role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Join Xytex</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Xytex
              </h1>
              <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">
                Donor Management Platform
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 24px; font-weight: 600;">
                You're Invited! 🎉
              </h2>
              
              <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                ${invitedByName ? `<strong>${invitedByName}</strong> has invited you` : 'You have been invited'} to join the Xytex team as a <strong style="color: #0f172a;">${roleDisplay}</strong>.
              </p>
              
              <p style="margin: 0 0 32px; color: #475569; font-size: 16px; line-height: 1.6;">
                Click the button below to create your account and get started:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.4);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Link fallback - More prominent -->
              <div style="margin: 32px 0 0; padding: 20px; background-color: #f1f5f9; border-radius: 8px; border: 1px solid #e2e8f0;">
                <p style="margin: 0 0 12px; color: #475569; font-size: 14px; font-weight: 600;">
                  Your Invitation Link:
                </p>
                <p style="margin: 0; word-break: break-all;">
                  <a href="${inviteLink}" style="color: #3b82f6; text-decoration: none; font-size: 15px; font-weight: 500;">${inviteLink}</a>
                </p>
                <p style="margin: 12px 0 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                  If the button above doesn't work, copy and paste this link into your browser.
                </p>
              </div>
              
              <!-- Expiry notice -->
              <div style="margin-top: 32px; padding: 16px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>Note:</strong> This invitation expires on ${expiryDate}.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 13px; text-align: center;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <p style="margin: 12px 0 0; color: #94a3b8; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Xytex. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
You're Invited to Join Xytex!

${invitedByName ? `${invitedByName} has invited you` : 'You have been invited'} to join the Xytex team as a ${roleDisplay}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR INVITATION LINK:
${inviteLink}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Click the link above to create your account and get started.

Note: This invitation expires on ${expiryDate}.

If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} Xytex. All rights reserved.
  `;

  return sendEmail({
    to: email,
    subject: `You're invited to join Xytex as ${roleDisplay}`,
    html,
    text,
  });
}

