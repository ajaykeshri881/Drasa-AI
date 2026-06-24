import nodemailer from 'nodemailer';

// Helper to get transporter configured via env vars
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export async function sendSubscriptionCancelledEmail(toEmail: string, userName: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[Email Skipped] SMTP credentials not set. Would have sent cancellation email to ${toEmail}`);
    return;
  }

  const transporter = getTransporter();

  const mailOptions = {
    from: `"Drasa AI" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Your Drasa AI Auto-pay Subscription has been Cancelled",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Subscription Cancelled</h2>
        <p>Hi ${userName},</p>
        <p>We're confirming that your Auto-pay subscription for Drasa AI has been successfully cancelled.</p>
        <p>Your account has been downgraded to the Free plan and you will no longer be billed automatically.</p>
        <br/>
        <p>If you'd like to reactivate your subscription at any time, you can do so from your dashboard.</p>
        <p>Best regards,<br/>The Drasa AI Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Cancellation email sent to ${toEmail}`);
  } catch (error) {
    console.error(`Failed to send cancellation email to ${toEmail}:`, error);
  }
}
