'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RECIPES_CAPABILITY } from '@/lib/api/studioBootstrap';
import { studioAreaManageHref } from '@/lib/studio/studioAreas';

/**
 * The list lives on the studio home recipes tab.
 * This address stays behind the recipes gate, then replaces itself with that tab.
 * The home does not link back here.
 */
export default function RecipesPage() {
  const router = useRouter();
  const href = studioAreaManageHref(RECIPES_CAPABILITY);

  useEffect(() => {
    router.replace(href);
  }, [href, router]);

  return null;
}
