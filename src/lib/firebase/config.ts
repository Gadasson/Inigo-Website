export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
};

/** Static property access — required so Next.js inlines NEXT_PUBLIC_* in the client bundle. */
export function getFirebaseClientConfig(): FirebaseClientConfig {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim();

  if (!apiKey) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_FIREBASE_API_KEY');
  }
  if (!authDomain) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  }
  if (!projectId) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  }
  if (!appId) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_FIREBASE_APP_ID');
  }

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || undefined,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() || undefined,
  };
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
  );
}
