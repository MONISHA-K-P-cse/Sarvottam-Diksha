const apiKey = "AIzaSyCxxW3WR_SkXX2ekkf3mkK7jdDSKV2Dvss";

async function testFirebaseRestApi() {
  console.log('Sending request to Firebase IdentityToolkit REST API...');
  
  // 1. Try sending password reset email
  const resetRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestType: "PASSWORD_RESET",
      email: "pmonisha0629@gmail.com"
    })
  });

  const resetData = await resetRes.json();
  console.log('Password Reset Response:', JSON.stringify(resetData, null, 2));

  if (resetData.error && resetData.error.message === 'EMAIL_NOT_FOUND') {
    console.log('\nUser not found in Firebase Auth. Attempting to create user...');
    const signUpRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: "pmonisha0629@gmail.com",
        password: "TempPassword123!",
        returnSecureToken: true
      })
    });
    const signUpData = await signUpRes.json();
    console.log('Sign Up Response:', JSON.stringify(signUpData, null, 2));

    if (signUpData.email) {
      console.log('\nRetrying sendOobCode now that user exists in Firebase Auth...');
      const retryRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: "PASSWORD_RESET",
          email: "pmonisha0629@gmail.com"
        })
      });
      const retryData = await retryRes.json();
      console.log('Retry Response:', JSON.stringify(retryData, null, 2));
    }
  }
}

testFirebaseRestApi();
