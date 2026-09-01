import nodemailer from 'nodemailer';

let transporter = null;

// Initialize Transporter
async function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT, SMTP_SECURE } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    console.log(`📧 Initializing SMTP Transporter using host: ${SMTP_HOST}`);
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '587'),
      secure: SMTP_SECURE === 'true',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  } else {
    // Ethereal fallback for local development & testing
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (err) {
      console.warn('⚠️ Could not initialize Ethereal test account:', err.message);
      transporter = null;
    }
  }
  return transporter;
}

/**
 * Send Password Reset Email with HTML template
 */
export async function sendPasswordResetEmail({ toEmail, userName, resetToken, resetLink }) {
  try {
    const mailTransporter = await getTransporter();

    if (!mailTransporter) {
      console.log(`🔑 [DEV MODE RESET LINK] Password reset link for ${toEmail}: ${resetLink}`);
      return { success: true, isDemoFallback: true, resetLink };
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center; border-bottom: 3px solid #0284c7; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { color: #f59e0b; margin: 6px 0 0 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
          .content { padding: 32px 28px; line-height: 1.6; }
          .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
          .reset-btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; font-weight: 800; font-size: 15px; padding: 14px 28px; text-decoration: none; border-radius: 12px; margin: 24px 0; text-align: center; box-shadow: 0 4px 12px rgba(2,132,199,0.3); }
          .token-box { background: #f1f5f9; border: 1px dashed #cbd5e1; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 13px; text-align: center; margin-top: 10px; word-break: break-all; color: #0284c7; font-weight: bold; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SARVOTTAM DIKSHA</h1>
            <p>Mathematics Tuition & Exam Prep</p>
          </div>
          <div class="content">
            <div class="greeting">Hello ${userName || 'Student'}, 👋</div>
            <p>We received a request to reset the password for your Sarvottam Diksha account registered under <strong>${toEmail}</strong>.</p>
            <p>Click the button below to set a new password for your account. This link will expire in <strong>1 hour</strong>.</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="reset-btn" target="_blank">Reset My Password →</a>
            </div>

            <p style="font-size: 13px; color: #64748b;">If the button doesn't work, copy and paste this link into your browser:</p>
            <div class="token-box">${resetLink}</div>

            <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          </div>
          <div class="footer">
            © 2026 Sarvottam Diksha Mathematics. Lead Educator: Manika Maheshwari.
          </div>
        </div>
      </body>
      </html>
    `;

    const fromSender = process.env.SMTP_FROM || (process.env.SMTP_USER ? `"Sarvottam Diksha Support" <${process.env.SMTP_USER}>` : '"Sarvottam Diksha Support" <noreply@sarvottamdiksha.com>');

    const info = await mailTransporter.sendMail({
      from: fromSender,
      to: toEmail,
      subject: '🔑 Password Reset Request - Sarvottam Diksha',
      html: htmlContent
    });

    console.log(`✉️ Password reset email sent to ${toEmail}. MessageID: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`🔗 Preview Email URL: ${previewUrl}`);
    }

    return { success: true, messageId: info.messageId, previewUrl, resetLink };
  } catch (err) {
    console.error('Failed to send password reset email via SMTP:', err.message);
    console.log(`🔑 [FALLBACK RESET LINK] Password reset link for ${toEmail}: ${resetLink}`);
    return { success: true, isDemoFallback: true, resetLink, error: err.message };
  }
}
