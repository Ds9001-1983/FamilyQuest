import { useAppState } from '@/hooks/use-app-state';

export function ModeToggle() {
  const { mode, toggleMode } = useAppState();

  const handleToggle = () => {
    console.log('Before toggle, current mode:', mode);
    
    // First save the new mode to localStorage
    const newMode = mode === 'child' ? 'parent' : 'child';
    localStorage.setItem('levelMissionMode', newMode);
    console.log('Saved new mode to localStorage:', newMode);
    
    // Then reload the page to apply the change
    window.location.reload();
  };

  return (
    <button
      onClick={handleToggle}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        mode === 'parent' 
          ? 'bg-mission-green text-white' 
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      {mode === 'parent' ? '👨‍👩‍👧‍👦 Eltern-Modus' : '🧒 Kind-Modus'}
    </button>
  );
}
