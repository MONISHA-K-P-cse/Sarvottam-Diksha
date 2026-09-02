import nodemailer from 'nodemailer';

async function sendTest() {
  console.log('Sending real test email via authenticated Gmail SMTP...');
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'sarvottamdiksha.support@gmail.com',
      pass: 'xiumftylpfovrmek'
    }
  });

  const resetLink = `https://sarvottam-diksha.web.app/reset-password?email=pmonisha0629@gmail.com&token=sd_sec_live_smtp_${Date.now()}`;

  const info = await transporter.sendMail({
    from: '"Sarvottam Diksha Support" <sarvottamdiksha.support@gmail.com>',
    to: 'pmonisha0629@gmail.com',
    subject: '🔑 Reset Your Sarvottam Diksha Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0284c7; margin: 0; font-size: 24px;">Sarvottam Diksha Mathematics</h2>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Student & Admin Learning Portal</p>
        </div>
        <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #cbd5e1;">
          <h3 style="color: #0f172a; margin-top: 0;">Password Reset Request</h3>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            Hello, we received a request to reset your password for your Sarvottam Diksha account (<strong>pmonisha0629@gmail.com</strong>).
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetLink}" style="background: #0284c7; color: #ffffff; padding: 14px 28px; border-radius: 10px; font-weight: bold; font-size: 15px; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.3);">
              Reset Password Now →
            </a>
          </div>
          <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">
            This link is valid for 1 hour. If you did not request this, you can safely ignore this email.
          </p>
        </div>
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
          Sarvottam Diksha Mathematics (Grades 6–12 CBSE / ICSE / JEE)
        </p>
      </div>
    `
  });

  console.log('✅ Email sent successfully! MessageId:', info.messageId);
}

sendTest().catch(console.error);
