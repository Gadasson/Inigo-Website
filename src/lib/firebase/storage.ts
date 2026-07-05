'use client';

import { getFirebaseClientConfig } from '@/lib/firebase/config';

export type UploadProgressCallback = (percent: number) => void;

async function getOrInitFirebaseApp() {
  const { initializeApp, getApps } = await import('firebase/app');
  const existing = getApps();
  if (existing.length > 0) {
    return existing[0]!;
  }
  return initializeApp(getFirebaseClientConfig());
}

/** Loads firebase/storage on demand — never imports firebase/auth. */
export async function uploadFileToFirebaseStorage(
  storagePath: string,
  file: File,
  onProgress?: UploadProgressCallback,
): Promise<string> {
  const bucket = getFirebaseClientConfig().storageBucket?.trim();
  if (!bucket) {
    throw new Error(
      'Firebase Storage is not configured. Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.',
    );
  }

  const [{ getDownloadURL, getStorage, ref, uploadBytesResumable }, app] = await Promise.all([
    import('firebase/storage'),
    getOrInitFirebaseApp(),
  ]);

  const firebaseStorage = getStorage(app, `gs://${bucket}`);
  const objectRef = ref(firebaseStorage, storagePath);

  const uploadTask = uploadBytesResumable(objectRef, file, {
    contentType: file.type || undefined,
  });

  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes <= 0) {
          onProgress?.(0);
          return;
        }
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress?.(percent);
      },
      reject,
      () => resolve(),
    );
  });

  onProgress?.(100);
  return getDownloadURL(uploadTask.snapshot.ref);
}
