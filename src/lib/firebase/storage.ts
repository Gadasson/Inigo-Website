'use client';

import { getFirebaseApp } from '@/lib/firebase/client';
import { getFirebaseClientConfig } from '@/lib/firebase/config';

/** Loads firebase/storage on demand so it stays out of the server bundle. */
export async function uploadFileToFirebaseStorage(
  storagePath: string,
  file: File,
): Promise<string> {
  const bucket = getFirebaseClientConfig().storageBucket?.trim();
  if (!bucket) {
    throw new Error(
      'Firebase Storage is not configured. Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.',
    );
  }

  const { getDownloadURL, getStorage, ref, uploadBytes } = await import('firebase/storage');
  const firebaseStorage = getStorage(getFirebaseApp(), `gs://${bucket}`);
  const objectRef = ref(firebaseStorage, storagePath);

  await uploadBytes(objectRef, file, {
    contentType: file.type || undefined,
  });

  return getDownloadURL(objectRef);
}
