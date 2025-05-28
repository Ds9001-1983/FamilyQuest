import { useState, useEffect } from 'react';

export type AppMode = 'child' | 'parent';

export function useAppState() {
  // Load initial mode from localStorage immediately
  const getInitialMode = (): AppMode => {
    const savedMode = localStorage.getItem('levelMissionMode') as AppMode;
    return (savedMode === 'parent' || savedMode === 'child') ? savedMode : 'child';
  };

  const [mode, setMode] = useState<AppMode>(getInitialMode);
  const [currentUserId, setCurrentUserId] = useState(() => {
    const initialMode = getInitialMode();
    return initialMode === 'child' ? 2 : 1;
  });

  const toggleMode = () => {
    const newMode = mode === 'child' ? 'parent' : 'child';
    setMode(newMode);
    setCurrentUserId(newMode === 'child' ? 2 : 1);
    localStorage.setItem('levelMissionMode', newMode);
  };

  // Debug logging
  console.log('useAppState - current mode:', mode, 'userId:', currentUserId);

  return {
    mode,
    currentUserId,
    toggleMode,
  };
}
