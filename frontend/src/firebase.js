// Firebase Client Configuration & Helper
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  signOut
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDemoConfigKeySarvottamDiksha2026",
  authDomain: "sarvottam-diksha.firebaseapp.com",
  projectId: "sarvottam-diksha",
  storageBucket: "sarvottam-diksha.appspot.com",
  messagingSenderId: "98765432100",
  appId: "1:98765432100:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  signOut
};
