import { useAppState } from '@/hooks/use-app-state';

export function ModeToggle() {
  const { mode, toggleMode } = useAppState();

  const handleToggle = () => {
    toggleMode();
    // Force a page refresh to ensure UI updates
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
