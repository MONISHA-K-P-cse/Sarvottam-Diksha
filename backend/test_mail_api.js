async function testWeb3Forms() {
  console.log('Testing email delivery via Web3Forms API...');
  const resetLink = `https://sarvottam-diksha.web.app/reset-password?email=pmonisha0629@gmail.com&token=sd_sec_${Date.now()}`;
  
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: 'a1b2c3d4-demo-test-key',
        subject: '🔑 Sarvottam Diksha - Reset Your Password',
        from_name: 'Sarvottam Diksha Mathematics',
        to: 'pmonisha0629@gmail.com',
        message: `Hello,\n\nYou requested to reset your password for Sarvottam Diksha Mathematics Portal.\n\nPlease click the link below to set your new password:\n${resetLink}\n\nThis link is valid for 1 hour.\n\nWarm regards,\nSarvottam Diksha Team`
      })
    });
    const data = await res.json();
    console.log('Web3Forms response:', data);
  } catch (err) {
    console.log('Error:', err.message);
  }
}

testWeb3Forms();
