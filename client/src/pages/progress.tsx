import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Calendar, Trophy, Target } from 'lucide-react';
import { useAppState } from '@/hooks/use-app-state';
import { Skeleton } from '@/components/ui/skeleton';
import type { User, Mission, Reward } from '@shared/schema';

export default function Progress() {
  const { currentUserId } = useAppState();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  const { data: allMissions = [], isLoading: missionsLoading } = useQuery<Mission[]>({
    queryKey: ['/api/missions/all'],
    queryFn: async () => {
      const response = await fetch('/api/missions', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch missions');
      return response.json();
    },
  });

  const { data: rewards = [], isLoading: rewardsLoading } = useQuery<Reward[]>({
    queryKey: ['/api/rewards'],
  });

  if (userLoading || missionsLoading || rewardsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
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

  const userMissions = allMissions.filter(mission => mission.assignedToUserId === currentUserId);
  const completedMissions = userMissions.filter(mission => mission.completed);
  const activeMissions = userMissions.filter(mission => !mission.completed);
  const completionRate = userMissions.length > 0 ? (completedMissions.length / userMissions.length) * 100 : 0;
  const availableRewards = rewards.filter(reward => reward.requiredXP <= user.totalXP);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-mission-text mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-mission-green" />
          Dein Fortschritt
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-mission-green/10 rounded-xl">
            <p className="text-3xl font-bold text-mission-green">{user.totalXP}</p>
            <p className="text-sm text-gray-600 mt-1">Gesamt XP</p>
          </div>
          
          <div className="text-center p-4 bg-mission-blue/10 rounded-xl">
            <p className="text-3xl font-bold text-mission-blue">{completedMissions.length}</p>
            <p className="text-sm text-gray-600 mt-1">Erledigte Missionen</p>
          </div>
          
          <div className="text-center p-4 bg-mission-yellow/10 rounded-xl">
            <p className="text-3xl font-bold text-mission-yellow">{Math.round(completionRate)}%</p>
            <p className="text-sm text-gray-600 mt-1">Erfolgsrate</p>
          </div>
          
          <div className="text-center p-4 bg-purple-100 rounded-xl">
            <p className="text-3xl font-bold text-purple-600">{availableRewards.length}</p>
            <p className="text-sm text-gray-600 mt-1">Belohnungen</p>
          </div>
        </div>
      </div>

      {/* Mission Status */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-mission-text mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-mission-blue" />
          Mission Status
        </h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Aktive Missionen</span>
            <span className="font-semibold text-mission-blue">{activeMissions.length}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Erledigte Missionen</span>
            <span className="font-semibold text-mission-green">{completedMissions.length}</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-mission-green h-3 rounded-full transition-all duration-500" 
              style={{ width: `${completionRate}%` }}
            />
          </div>
          
          <p className="text-sm text-gray-600 text-center">
            {completionRate === 100 ? "Alle Missionen erledigt! 🎉" : `${Math.round(completionRate)}% der Missionen erledigt`}
          </p>
        </div>
      </div>

      {/* Recent Achievements */}
      {completedMissions.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-mission-text mb-4 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-mission-yellow" />
            Letzte Erfolge
          </h2>
          
          <div className="space-y-3">
            {completedMissions
              .slice(-3)
              .reverse()
              .map((mission) => (
                <div key={mission.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl">
                  <div className="w-10 h-10 bg-mission-green rounded-full flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-mission-text">{mission.title}</p>
                    <p className="text-sm text-gray-600">+{mission.xpReward} XP erhalten</p>
                  </div>
                  {mission.completedAt && (
                    <p className="text-xs text-gray-500">
                      {new Date(mission.completedAt).toLocaleDateString('de-DE')}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Motivational Message */}
      <div className="bg-gradient-to-r from-mission-green to-mission-blue rounded-2xl p-6 text-white text-center">
        <h3 className="text-xl font-bold mb-2">Weiter so! 🚀</h3>
        <p className="text-white/90">
          {activeMissions.length > 0 
            ? `Du hast noch ${activeMissions.length} Mission${activeMissions.length === 1 ? '' : 'en'} zu erledigen!`
            : "Du hast alle Missionen erledigt! Du bist fantastisch!"
          }
        </p>
      </div>
    </div>
  );
}
