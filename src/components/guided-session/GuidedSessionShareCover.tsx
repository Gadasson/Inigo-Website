'use client';

import LoadingRemoteImage from '@/components/LoadingRemoteImage';

type Props = {
  src: string;
};

export default function GuidedSessionShareCover({ src }: Props) {
  return (
    <LoadingRemoteImage
      src={src}
      width={1200}
      height={750}
      decoding="async"
    />
  );
}
