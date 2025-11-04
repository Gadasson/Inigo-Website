'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useWorldState } from '../hooks/useWorldState';

const WorldStateContext = createContext<ReturnType<typeof useWorldState> | undefined>(undefined);

export function WorldStateProvider({ children }: { children: ReactNode }) {
  const worldState = useWorldState();
  
  return (
    <WorldStateContext.Provider value={worldState}>
      {children}
    </WorldStateContext.Provider>
  );
}

export function useWorldStateContext() {
  const context = useContext(WorldStateContext);
  if (context === undefined) {
    throw new Error('useWorldStateContext must be used within a WorldStateProvider');
  }
  return context;
}

