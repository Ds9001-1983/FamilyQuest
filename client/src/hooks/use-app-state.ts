import { useState, useEffect } from 'react';

export type AppMode = 'child' | 'parent';

export function useAppState() {
  const [mode, setMode] = useState<AppMode>('child');
  const [currentUserId, setCurrentUserId] = useState(2); // Default to child user

  const toggleMode = () => {
    const newMode = mode === 'child' ? 'parent' : 'child';
    setMode(newMode);
    setCurrentUserId(newMode === 'child' ? 2 : 1); // Switch between child (2) and parent (1)
  };

  useEffect(() => {
    // Save mode to localStorage
    localStorage.setItem('levelMissionMode', mode);
  }, [mode]);

  useEffect(() => {
    // Load mode from localStorage on mount
    const savedMode = localStorage.getItem('levelMissionMode') as AppMode;
    if (savedMode && (savedMode === 'child' || savedMode === 'parent')) {
      setMode(savedMode);
      setCurrentUserId(savedMode === 'child' ? 2 : 1);
    }
  }, []);

  return {
    mode,
    currentUserId,
    toggleMode,
  };
}
