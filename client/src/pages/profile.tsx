import { useQuery } from '@tanstack/react-query';
import { User, Settings, LogOut, Shield } from 'lucide-react';
import { useAppState } from '@/hooks/use-app-state';
import { ModeToggle } from '@/components/ModeToggle';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { User as UserType } from '@shared/schema';

export default function Profile() {
  const { mode } = useAppState();
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery<UserType>({
    queryKey: ['/api/user'],
  });

  const handleAction = (action: string) => {
    toast({
      title: action,
      description: "Funktion wird in Zukunft implementiert!",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Benutzer nicht gefunden</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-mission-green to-mission-blue rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-mission-text">{user.username}</h2>
            <p className="text-gray-600 flex items-center">
              {user.isParent ? (
                <>
                  <Shield className="h-4 w-4 mr-1" />
                  Eltern-Account
                </>
              ) : (
                'Kind-Account'
              )}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center p-3 bg-mission-green/10 rounded-xl">
            <p className="text-2xl font-bold text-mission-green">{user.totalXP}</p>
            <p className="text-sm text-gray-600">Gesamt XP</p>
          </div>
          <div className="text-center p-3 bg-mission-blue/10 rounded-xl">
            <p className="text-2xl font-bold text-mission-blue">Level {Math.floor(user.totalXP / 100) + 1}</p>
            <p className="text-sm text-gray-600">Aktuelles Level</p>
          </div>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-mission-text mb-4">Modus-Einstellungen</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-mission-text">Aktueller Modus</p>
            <p className="text-sm text-gray-600">
              {mode === 'child' ? 'Kind-Ansicht' : 'Eltern-Ansicht'}
            </p>
          </div>
          <ModeToggle />
        </div>
      </div>

      {/* Settings & Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-mission-text mb-4">Einstellungen</h3>
        
        <div className="space-y-3">
          <button
            onClick={() => handleAction("Benachrichtigungen")}
            className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-xl transition-colors"
          >
            <Settings className="h-5 w-5 text-gray-500" />
            <div className="flex-1">
              <p className="font-medium text-mission-text">Benachrichtigungen</p>
              <p className="text-sm text-gray-600">Push-Benachrichtigungen verwalten</p>
            </div>
          </button>

          <button
            onClick={() => handleAction("Account-Einstellungen")}
            className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-xl transition-colors"
          >
            <User className="h-5 w-5 text-gray-500" />
            <div className="flex-1">
              <p className="font-medium text-mission-text">Account-Einstellungen</p>
              <p className="text-sm text-gray-600">Profil und Passwort ändern</p>
            </div>
          </button>

          {user.isParent && (
            <button
              onClick={() => handleAction("Familien-Verwaltung")}
              className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-xl transition-colors"
            >
              <Shield className="h-5 w-5 text-gray-500" />
              <div className="flex-1">
                <p className="font-medium text-mission-text">Familien-Verwaltung</p>
                <p className="text-sm text-gray-600">Kinder-Accounts verwalten</p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* App Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-mission-text mb-4">App-Info</h3>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Version</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Letzte Aktualisierung</span>
            <span>{new Date().toLocaleDateString('de-DE')}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => handleAction("Abmelden")}
            className="w-full flex items-center justify-center space-x-2 p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Abmelden</span>
          </button>
        </div>
      </div>
    </div>
  );
}
