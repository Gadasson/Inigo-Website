import { useState, useEffect, useCallback } from 'react';

interface WorldStateInfo {
  // Legacy fields (for backward compatibility)
  main_state: string;
  sub_state: string;
  next_sub_state: string | null;
  
  // Numeric identifiers
  main_state_number: number;
  sub_state_number: number;
  
  // Translation keys (USE THESE!)
  main_state_key: string;
  sub_state_key: string;
  next_sub_state_key: string | null;
  
  // Progress data
  current_minutes: number;
  active_users: number;
  progress_percentage: number;
  next_threshold: number;
  user_multiplier: number;
  minutes_to_next: number;
  timestamp: string;
}

interface StateDefinition {
  id: number;
  name: string;
  description: string;
  state_key: string;
  description_key: string;
  icon: string;
  color: string;
  threshold: number;
  order_index: number;
}

interface SubStateDefinition {
  main_state: number;
  sub_state: number;
  name: string;
  description: string;
  state_key: string;
  description_key: string;
}

interface WorldStateResponse {
  status_code: string;
  total_minutes_today: number;
  target_minutes_today: number;
  users_today: number;
  streak_days: number;
  server_timestamp: string;
  state_info: WorldStateInfo;
  state_definitions: StateDefinition[];
  substate_definitions: SubStateDefinition[];
}

// Use local API route as proxy to avoid CORS issues in development
const API_ENDPOINT = '/api/world-state';

export function useWorldState() {
  const [worldState, setWorldState] = useState<WorldStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorldState = useCallback(async () => {
    try {
      // Set loading state for both initial load and manual refresh
      // This allows the UI to show loading indicators during refresh
      setLoading(true);
      setError(null);
      
      // Create timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(API_ENDPOINT, {
          // Add cache control to ensure fresh data
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.status === 429) {
          const errorData = await response.json().catch(() => ({}));
          const retryAfter = errorData.retry_after || 60;
          console.warn(`Rate limited. Retry after ${retryAfter} seconds`);
          setError(new Error(`Rate limit exceeded. Please try again later.`));
          setLoading(false);
          return;
        }
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          console.error(`API Error ${response.status}:`, errorText);
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        
        const data: WorldStateResponse = await response.json();
        // Set data and loading state together to ensure immediate update
        setWorldState(data);
        setError(null);
        setLoading(false); // Set loading to false immediately after data is set
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // Handle abort (timeout)
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request timeout - server took too long to respond');
        }
        throw fetchError;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setLoading(false); // Set loading to false on error too
      console.error('Error fetching world state:', err);
      // Log more details for debugging
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.error('Network error - check CORS or connectivity');
      }
      
      // NO RETRY LOGIC - user must manually refresh
      // This prevents infinite retry loops
    }
  }, []);

  useEffect(() => {
    // Fetch once on mount (initial load)
    fetchWorldState();
  }, [fetchWorldState]);

  return { worldState, loading, error, refetch: () => fetchWorldState() };
}

