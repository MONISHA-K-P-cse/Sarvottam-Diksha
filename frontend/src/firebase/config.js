import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

// Firebase configuration from environment variables with fallback defaults
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCxxW3WR_SkXX2ekkf3mkK7jdDSKV2Dvss",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sarvottam-diksha.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sarvottam-diksha",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sarvottam-diksha.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "188798834097",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:188798834097:web:1472455ded3c7b8ca89990"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Auth
export const auth = getAuth(app);

// Helper function to translate Firebase Error codes to friendly user messages
export const getFirebaseErrorMessage = (error) => {
  const code = error?.code || (typeof error === 'string' ? error : '');
  switch (code) {
    case 'auth/user-not-found':
      return 'Constraint Failed: No account found with this email address.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Constraint Failed: Incorrect email or password. Please verify your credentials.';
    case 'auth/email-already-in-use':
      return 'Constraint Failed: An account with this email address already exists. Try signing in instead.';
    case 'auth/weak-password':
      return 'Constraint Failed: Password must be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Constraint Failed: Please enter a valid email address (e.g., student@domain.com).';
    case 'auth/missing-password':
      return 'Constraint Failed: Password field cannot be empty.';
    case 'auth/missing-email':
      return 'Constraint Failed: Email address field cannot be empty.';
    case 'auth/too-many-requests':
      return 'Constraint Failed: Too many failed login attempts. Access temporarily locked for security.';
    case 'auth/network-request-failed':
      return 'Network Error: Please check your internet connection.';
    default:
      return error?.message || 'Authentication error. Please check all constraints and try again.';
  }
};

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
};
