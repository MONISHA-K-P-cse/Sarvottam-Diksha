import { initializeApp } from 'firebase/app';
import { getAuth, sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth';

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

async function test() {
  console.log('Testing sending password reset email to pmonisha0629@gmail.com...');
  try {
    await sendPasswordResetEmail(auth, 'pmonisha0629@gmail.com');
    console.log('✅ SUCCESS: sendPasswordResetEmail resolved without error!');
  } catch (err) {
    console.log('❌ ERROR in sendPasswordResetEmail:');
    console.log('Code:', err.code);
    console.log('Message:', err.message);

    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      console.log('\nTrying to create user first in Firebase Auth...');
      try {
        const userCred = await createUserWithEmailAndPassword(auth, 'pmonisha0629@gmail.com', 'TempPass@123456');
        console.log('User created:', userCred.user.email);
        await sendPasswordResetEmail(auth, 'pmonisha0629@gmail.com');
        console.log('✅ SUCCESS after user creation!');
      } catch (createErr) {
        console.log('❌ ERROR in createUserWithEmailAndPassword:');
        console.log('Code:', createErr.code);
        console.log('Message:', createErr.message);
      }
    }
  }
}

test();
