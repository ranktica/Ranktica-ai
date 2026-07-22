import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from 'firebase/firestore';

// Read config from auto-provisioned config file
import config from '../../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(config) : getApp();
export const auth = getAuth(app);

// Gracefully enable persistent local cache (offline mode support inside sandboxed preview iFrames)
let firestoreDbInstance;
try {
  firestoreDbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (error) {
  console.warn('[Firebase] Offline Persistent cache initialization bypassed or unsupported in current sandboxed frame context:', error);
  firestoreDbInstance = getFirestore(app);
}

export const firestoreDb = firestoreDbInstance;

// Keep the active Google OAuth Access Token in-memory only (security guideline)
let cachedGoogleAccessToken: string | null = null;
let cachedEmail: string | null = null;

export const getCachedToken = () => cachedGoogleAccessToken;
export const setCachedToken = (token: string | null) => {
  cachedGoogleAccessToken = token;
};

export const getCachedEmail = () => cachedEmail;

export const loginWithGoogle = async (): Promise<{ email: string; name: string; token: string }> => {
  const provider = new GoogleAuthProvider();
  // Request required scopes
  provider.addScope('https://www.googleapis.com/auth/youtube.upload');
  provider.addScope('https://www.googleapis.com/auth/youtube');
  provider.addScope('https://www.googleapis.com/auth/yt-analytics.readonly');
  provider.addScope('https://www.googleapis.com/auth/calendar.events');

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;

  if (!token) {
    throw new Error('Could not retrieve YouTube OAuth Google access token. Please grant permissions.');
  }

  cachedGoogleAccessToken = token;
  const user = result.user;
  cachedEmail = user.email;

  return {
    email: user.email || '',
    name: user.displayName || 'Authorized Creator',
    token
  };
};

export const handleSignOut = async () => {
  await signOut(auth);
  cachedGoogleAccessToken = null;
  cachedEmail = null;
};
