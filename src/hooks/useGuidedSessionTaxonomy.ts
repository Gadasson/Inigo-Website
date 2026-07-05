'use client';

import { useEffect, useState } from 'react';
import { getGuidedSessionTaxonomy } from '@/lib/api/studioGuidedSessionTaxonomy';
import type { GuidedSessionTaxonomy } from '@/lib/studio/guidedSessionTaxonomy';
import { parseStudioApiError } from '@/lib/studio/parseStudioApiError';
import { useAuth } from '@/contexts/AuthContext';

export type GuidedSessionTaxonomyState = {
  taxonomy: GuidedSessionTaxonomy | null;
  loading: boolean;
  error: string | null;
};

export function useGuidedSessionTaxonomy(): GuidedSessionTaxonomyState {
  const { user, getIdToken } = useAuth();
  const [taxonomy, setTaxonomy] = useState<GuidedSessionTaxonomy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTaxonomy(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function loadTaxonomy() {
      setLoading(true);
      setError(null);

      try {
        const token = await getIdToken();
        const data = await getGuidedSessionTaxonomy(token);
        if (!cancelled) {
          setTaxonomy(data);
        }
      } catch (err) {
        if (!cancelled) {
          setTaxonomy(null);
          setError(parseStudioApiError(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTaxonomy();

    return () => {
      cancelled = true;
    };
  }, [user, getIdToken]);

  return { taxonomy, loading, error };
}
