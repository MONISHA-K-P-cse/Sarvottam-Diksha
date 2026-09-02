async function testDirectEmail() {
  console.log('Testing sending direct email via web hook...');
  const resetLink = `https://sarvottam-diksha.web.app/reset-password?email=pmonisha0629@gmail.com&token=sd_sec_live_${Date.now()}`;

  // Test with FormSubmit / Web3Forms
  try {
    const res = await fetch('https://formsubmit.co/ajax/pmonisha0629@gmail.com', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: '🔑 Sarvottam Diksha - Reset Your Password',
        _template: 'box',
        name: 'Sarvottam Diksha Mathematics',
        message: `You requested to reset your password for Sarvottam Diksha Mathematics Portal.\n\nPlease open this link to set your new password:\n${resetLink}\n\nThis link is valid for 1 hour.`
      })
    });
    const data = await res.json();
    console.log('FormSubmit Response:', data);
  } catch (err) {
    console.log('FormSubmit Error:', err.message);
  }
}

testDirectEmail();
