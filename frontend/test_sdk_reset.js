import { initializeApp } from 'firebase/app';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCxxW3WR_SkXX2ekkf3mkK7jdDSKV2Dvss",
  authDomain: "sarvottam-diksha.firebaseapp.com",
  projectId: "sarvottam-diksha",
  storageBucket: "sarvottam-diksha.firebasestorage.app",
  messagingSenderId: "188798834097",
  appId: "1:188798834097:web:1472455ded3c7b8ca89990"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testSDK() {
  console.log('Sending reset email via Firebase Client SDK...');
  try {
    const actionCodeSettings = {
      url: 'https://sarvottam-diksha.web.app/reset-password',
      handleCodeInApp: true
    };
    await sendPasswordResetEmail(auth, 'pmonisha0629@gmail.com', actionCodeSettings);
    console.log('✅ Firebase SDK sendPasswordResetEmail resolved successfully with actionCodeSettings!');
  } catch (err) {
    console.error('❌ Firebase SDK Error:', err.code, err.message);
  }
}

testSDK();
