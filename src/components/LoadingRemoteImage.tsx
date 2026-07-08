'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  src: string;
  alt?: string;
  className?: string;
  wrapperClassName?: string;
  width?: number;
  height?: number;
  decoding?: 'async' | 'sync' | 'auto';
};

export default function LoadingRemoteImage({
  src,
  alt = '',
  className,
  wrapperClassName,
  width,
  height,
  decoding = 'async',
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <div
      className={['loading-remote-image', wrapperClassName].filter(Boolean).join(' ')}
      aria-busy={!loaded}
    >
      {!loaded ? (
        <div className="loading-remote-image__placeholder" aria-hidden>
          <span className="loading-remote-image__spinner" />
        </div>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        decoding={decoding}
        className={[
          'loading-remote-image__img',
          className,
          loaded ? 'loading-remote-image__img--loaded' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </div>
  );
}
