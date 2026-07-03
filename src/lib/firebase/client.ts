'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirebaseClientConfig, isFirebaseConfigured } from './config';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables.',
    );
  }

  if (!app) {
    const existing = getApps();
    app = existing.length > 0 ? existing[0]! : initializeApp(getFirebaseClientConfig());
  }

  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }

  return auth;
}
