'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CHALLENGES_CAPABILITY } from '@/lib/api/studioBootstrap';
import { studioAreaManageHref } from '@/lib/studio/studioAreas';

/**
 * The list lives on the studio home challenges tab.
 * This address stays behind the challenges gate, then replaces itself with that tab.
 * The home does not link back here.
 */
export default function ChallengesPage() {
  const router = useRouter();
  const href = studioAreaManageHref(CHALLENGES_CAPABILITY);

  useEffect(() => {
    router.replace(href);
  }, [href, router]);

  return null;
}
