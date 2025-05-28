import { useAppState } from '@/hooks/use-app-state';

export function ModeToggle() {
  const { mode, toggleMode } = useAppState();

  return (
    <div className="flex items-center space-x-2">
      <span className={`text-sm font-medium ${mode === 'child' ? 'text-mission-green' : 'text-gray-500'}`}>
        Kind
      </span>
      <button 
        onClick={toggleMode}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-mission-green focus:ring-offset-2 ${
          mode === 'parent' ? 'bg-mission-green' : 'bg-gray-300'
        }`}
      >
        <span 
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            mode === 'parent' ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className={`text-sm font-medium ${mode === 'parent' ? 'text-mission-green' : 'text-gray-500'}`}>
        Eltern
      </span>
    </div>
  );
}
