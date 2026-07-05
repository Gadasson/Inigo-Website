export type DetectableMediaRole = 'audio' | 'video';

const METADATA_TIMEOUT_MS = 15_000;

function loadMediaMetadata(
  element: HTMLAudioElement | HTMLVideoElement,
  objectUrl: string,
): Promise<number | null> {
  return new Promise((resolve) => {
    const timeoutId = window.setTimeout(() => {
      cleanup();
      resolve(null);
    }, METADATA_TIMEOUT_MS);

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      element.removeAttribute('src');
      element.load();
    };

    element.preload = 'metadata';

    element.addEventListener(
      'loadedmetadata',
      () => {
        const duration = element.duration;
        cleanup();
        resolve(Number.isFinite(duration) && duration > 0 ? duration : null);
      },
      { once: true },
    );

    element.addEventListener(
      'error',
      () => {
        cleanup();
        resolve(null);
      },
      { once: true },
    );

    element.src = objectUrl;
  });
}

/** Reads duration from a local audio/video file. Returns null if detection fails. */
export async function detectMediaFileDuration(
  file: File,
  role: DetectableMediaRole,
): Promise<number | null> {
  const objectUrl = URL.createObjectURL(file);

  try {
    if (role === 'audio') {
      return await loadMediaMetadata(document.createElement('audio'), objectUrl);
    }

    return await loadMediaMetadata(document.createElement('video'), objectUrl);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
