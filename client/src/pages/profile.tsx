import { useQuery } from '@tanstack/react-query';
import { User, LogOut, Trophy, Target } from 'lucide-react';
import { useAppState } from '@/hooks/use-app-state';
import { ModeToggle } from '@/components/ModeToggle';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import type { User as UserType, Reward } from '@shared/schema';

export default function Profile() {
  const { mode } = useAppState();
  const { logoutMutation } = useAuth();

  const { data: user, isLoading } = useQuery<UserType>({
    queryKey: ['/api/user'],
  });

  const { data: rewards = [] } = useQuery<Reward[]>({
    queryKey: ['/api/rewards'],
  });

  const handleLogout = () => {
    logoutMutation.mutate();
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

  // Calculate level and progress
  const level = Math.floor(user.totalXP / 100) + 1;
  const xpInCurrentLevel = user.totalXP % 100;
  const nextReward = rewards
    .filter(r => r.requiredXP > user.totalXP)
    .sort((a, b) => a.requiredXP - b.requiredXP)[0];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
            <User className="h-10 w-10 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-mission-text">{user.name || user.username}</h2>
            <p className="text-gray-600">Level {level}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <Trophy className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-green-600">{user.totalXP}</p>
            <p className="text-sm text-gray-600">Gesamt XP</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
            <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-purple-600">{level}</p>
            <p className="text-sm text-gray-600">Level</p>
          </div>
        </div>

        {/* Level Progress */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Level {level}</span>
            <span className="text-gray-600">Level {level + 1}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${xpInCurrentLevel}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            {100 - xpInCurrentLevel} XP bis zum nächsten Level
          </p>
        </div>
      </div>

      {/* Next Reward */}
      {nextReward && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-mission-text mb-4">Nächste Belohnung</h3>
          <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl">
            <div className="w-14 h-14 bg-amber-200 rounded-xl flex items-center justify-center">
              <Trophy className="h-7 w-7 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-800">{nextReward.name}</p>
              <p className="text-sm text-amber-600">
                Noch {nextReward.requiredXP - user.totalXP} XP
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mode Toggle */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-mission-text mb-4">Modus</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-mission-text">
              {mode === 'child' ? 'Kind-Ansicht' : 'Eltern-Ansicht'}
            </p>
            <p className="text-sm text-gray-500">
              {mode === 'child'
                ? 'Aufgaben erledigen und XP sammeln'
                : 'Aufgaben verwalten und genehmigen'
              }
            </p>
          </div>
          <ModeToggle />
        </div>
      </div>

      {/* App Info & Logout */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="space-y-3 text-sm text-gray-600 mb-6">
          <div className="flex justify-between">
            <span>Version</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-center gap-4 pt-2 border-t border-gray-100">
            <a href="/datenschutz" className="text-gray-500 hover:text-gray-700 transition-colors">
              Datenschutz
            </a>
            <span className="text-gray-300">|</span>
            <a href="/impressum" className="text-gray-500 hover:text-gray-700 transition-colors">
              Impressum
            </a>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="w-full flex items-center justify-center gap-2 p-4 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
        >
          <LogOut className="h-5 w-5" />
          <span>{logoutMutation.isPending ? 'Wird abgemeldet...' : 'Abmelden'}</span>
        </button>
      </div>
    </div>
  );
}
