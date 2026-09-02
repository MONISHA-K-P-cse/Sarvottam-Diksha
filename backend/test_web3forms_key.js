async function testCreateAccessKey() {
  console.log('Testing creating Web3Forms access key for sarvottamdiksha.support@gmail.com...');
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarvottamdiksha.support@gmail.com'
      })
    });
    const data = await res.json();
    console.log('Response:', data);
  } catch (err) {
    console.log('Error:', err.message);
  }
}

testCreateAccessKey();
