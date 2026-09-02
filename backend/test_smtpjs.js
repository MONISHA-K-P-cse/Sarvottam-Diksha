async function testSmtpJS() {
  console.log('Testing sending email via SmtpJS API...');
  const resetLink = `https://sarvottam-diksha.web.app/reset-password?email=pmonisha0629@gmail.com&token=live_smtp_${Date.now()}`;

  const bodyData = {
    Host: "smtp.gmail.com",
    Username: "sarvottamdiksha.support@gmail.com",
    Password: "xiumftylpfovrmek",
    To: "pmonisha0629@gmail.com",
    From: "sarvottamdiksha.support@gmail.com",
    Subject: "🔑 Reset Your Sarvottam Diksha Password",
    Body: `
      <h2>Sarvottam Diksha Mathematics</h2>
      <p>Click below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
    `,
    Action: "Send"
  };

  try {
    const res = await fetch('https://smtpjs.com/v3/smtpjs.aspx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams(bodyData).toString()
    });
    const text = await res.text();
    console.log('SmtpJS API Response:', text);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testSmtpJS();
