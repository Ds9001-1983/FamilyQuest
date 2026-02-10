import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      // Hide "reconnected" message after 3 seconds
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) {
    return null;
  }

  if (showReconnected) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-green-600 text-white py-2 px-4 text-center z-[100] animate-slide-down">
        <div className="flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4" />
          <span className="text-sm font-medium">Verbindung wiederhergestellt</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white py-2 px-4 text-center z-[100]">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">Keine Internetverbindung</span>
      </div>
    </div>
  );
}
