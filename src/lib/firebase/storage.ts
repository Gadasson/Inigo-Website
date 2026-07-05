'use client';

import { getFirebaseApp } from '@/lib/firebase/client';
import { getFirebaseClientConfig } from '@/lib/firebase/config';

export type UploadProgressCallback = (percent: number) => void;

/** Loads firebase/storage on demand so it stays out of the server bundle. */
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

  const { getDownloadURL, getStorage, ref, uploadBytesResumable } = await import(
    'firebase/storage'
  );
  const firebaseStorage = getStorage(getFirebaseApp(), `gs://${bucket}`);
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
