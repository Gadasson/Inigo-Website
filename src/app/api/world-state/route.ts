import { NextResponse } from 'next/server';

const API_ENDPOINT = 'https://api.inigo.now/api/world-state/';

// Fallback data when API is unavailable
const FALLBACK_DATA = {
  status_code: 'NO_ACTIVITY',
  total_minutes_today: 0,
  target_minutes_today: 1000,
  users_today: 0,
  streak_days: 0,
  server_timestamp: new Date().toISOString(),
  state_info: {
    main_state: 'calm',
    sub_state: 'building',
    next_sub_state: null,
    main_state_number: 1,
    sub_state_number: 1,
    main_state_key: 'WORLD_STATE_GETTING_STARTED',
    sub_state_key: 'SUBSTATE_1_1_FIRST_STEPS',
    next_sub_state_key: null,
    current_minutes: 0,
    active_users: 0,
    progress_percentage: 0,
    next_threshold: 1000,
    user_multiplier: 1,
    minutes_to_next: 1000,
    timestamp: new Date().toISOString(),
  },
  state_definitions: [
    {
      id: 1,
      name: 'Calm',
      description: 'The foundation of collective peace',
      state_key: 'WORLD_STATE_GETTING_STARTED',
      description_key: 'WORLD_STATE_GETTING_STARTED_DESCRIPTION',
      icon: '🌿',
      color: '#4F7942',
      threshold: 0,
      order_index: 1,
    },
  ],
  substate_definitions: [],
};

export async function GET() {
  try {
    // Create timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(API_ENDPOINT, {
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`World State API returned ${response.status}, using fallback data`);
        // Return fallback data instead of error so the app continues to work
        return NextResponse.json(FALLBACK_DATA);
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle timeout
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.warn('World State API timeout, using fallback data');
        return NextResponse.json(FALLBACK_DATA);
      }
      
      // For any other fetch error, return fallback data
      console.warn('World State API error, using fallback data:', fetchError);
      return NextResponse.json(FALLBACK_DATA);
    }
  } catch (error) {
    console.error('Unexpected error in world state API route:', error);
    // Always return fallback data instead of error
    return NextResponse.json(FALLBACK_DATA);
  }
}

