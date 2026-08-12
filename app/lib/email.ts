import { Resend } from 'resend';

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // No email provider configured yet: fall back to logging the link so the
    // reset flow is still testable end-to-end in development.
    console.warn(
      `[email] RESEND_API_KEY is not set. Password reset link for ${to}: ${resetUrl}`,
    );
    return;
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || 'Acme Dashboard <onboarding@resend.dev>';

  const { error } = await resend.emails.send({
    from,
    to,
    subject: 'Reset your Acme Dashboard password',
    html: `
      <p>We received a request to reset your Acme Dashboard password.</p>
      <p><a href="${resetUrl}">Click here to choose a new password</a>. This link expires in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });

  if (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email.');
  }
}
