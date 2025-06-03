import { useQuery } from '@tanstack/react-query';
import { Gift, Trophy, Star, Plus } from 'lucide-react';
import { useAppState } from '@/hooks/use-app-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CreateRewardDialog } from '@/components/CreateRewardDialog';
import type { User, Reward } from '@shared/schema';

export default function Rewards() {
  const { currentUserId, mode } = useAppState();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  const { data: rewards = [], isLoading: rewardsLoading } = useQuery<Reward[]>({
    queryKey: ['/api/rewards'],
  });

  if (userLoading || rewardsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
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

  const availableRewards = rewards.filter(reward => reward.requiredXP <= user.totalXP);
  const upcomingRewards = rewards.filter(reward => reward.requiredXP > user.totalXP);

  return (
    <div className="space-y-6">
      {/* Header with Add Reward Button for Parents */}
      {mode === 'parent' && (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Belohnungen verwalten</h2>
          <CreateRewardDialog />
        </div>
      )}

      {/* Current XP Display */}
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-mission-green to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="h-10 w-10 text-white fill-current" />
        </div>
        <h2 className="text-2xl font-bold text-mission-text mb-2">Deine XP</h2>
        <p className="text-4xl font-bold text-mission-green">{user.totalXP} XP</p>
      </div>

      {/* Available Rewards */}
      {availableRewards.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-mission-text mb-4 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-mission-green" />
            Verfügbare Belohnungen
          </h2>
          <div className="space-y-3">
            {availableRewards.map((reward) => (
              <div key={reward.id} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-mission-green/10 to-green-500/10 rounded-xl border border-mission-green/20">
                <div className="w-12 h-12 bg-mission-green rounded-full flex items-center justify-center">
                  <Gift className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-mission-text">{reward.name}</p>
                  <p className="text-sm text-gray-600">{reward.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-mission-green">Verfügbar!</p>
                  <p className="text-xs text-gray-500">{reward.requiredXP} XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Rewards */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-mission-text mb-4 flex items-center">
          <Gift className="h-5 w-5 mr-2 text-mission-blue" />
          Kommende Belohnungen
        </h2>
        {upcomingRewards.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Alle Belohnungen erreicht!</p>
            <p className="text-sm mt-1">Du bist ein wahrer Champion! 🏆</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingRewards
              .sort((a, b) => a.requiredXP - b.requiredXP)
              .map((reward) => {
                const remaining = reward.requiredXP - user.totalXP;
                const progress = (user.totalXP / reward.requiredXP) * 100;
                
                return (
                  <div key={reward.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-mission-blue rounded-full flex items-center justify-center">
                      <Gift className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-mission-text">{reward.name}</p>
                      <p className="text-sm text-gray-600 mb-1">{reward.description}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-mission-blue h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Noch {remaining} XP benötigt
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
