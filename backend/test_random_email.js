import nodemailer from 'nodemailer';

async function testRandomMail() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'sarvottamdiksha.support@gmail.com',
      pass: 'xiumftylpfovrmek'
    }
  });

  const testRecipients = [
    'sarvottamdiksha.support@gmail.com',
    'dikshasarvottam@gmail.com',
    'pmonisha0629@gmail.com'
  ];

  for (const recipient of testRecipients) {
    console.log(`\n📧 Sending test email to: ${recipient}...`);
    try {
      const resetLink = `https://sarvottam-diksha.web.app/reset-password?email=${encodeURIComponent(recipient)}&token=test_token_${Date.now()}`;
      const info = await transporter.sendMail({
        from: '"Sarvottam Diksha Portal" <sarvottamdiksha.support@gmail.com>',
        to: recipient,
        subject: `🔑 [TEST] Password Recovery for ${recipient}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #0284c7; border-radius: 10px;">
            <h2 style="color: #0284c7;">Sarvottam Diksha Mathematics</h2>
            <p>This is a live test email sent directly from <strong>sarvottamdiksha.support@gmail.com</strong>.</p>
            <p>Recipient: <strong>${recipient}</strong></p>
            <p>Time Sent: <strong>${new Date().toLocaleString()}</strong></p>
            <div style="margin: 20px 0;">
              <a href="${resetLink}" style="background: #0284c7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Reset Password Link
              </a>
            </div>
            <p style="color: #666; font-size: 12px;">Link: ${resetLink}</p>
          </div>
        `
      });
      console.log(`✅ SUCCESS for ${recipient}! Message ID: ${info.messageId}`);
    } catch (err) {
      console.error(`❌ FAILED for ${recipient}:`, err.message);
    }
  }
}

testRandomMail();
