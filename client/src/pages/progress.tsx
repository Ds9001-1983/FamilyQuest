import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, Calendar, Trophy, Target, RotateCcw, CheckCircle, Clock } from 'lucide-react';
import { useAppState } from '@/hooks/use-app-state';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { User, Mission, Reward } from '@shared/schema';

export default function Progress() {
  const { currentUserId, mode } = useAppState();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Fetch active missions
  const { data: activeMissions = [], isLoading: activeMissionsLoading } = useQuery<Mission[]>({
    queryKey: ['/api/missions', currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/missions?userId=${currentUserId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch missions');
      return response.json();
    },
  });

  // Fetch completed missions
  const { data: completedMissions = [], isLoading: completedMissionsLoading } = useQuery<Mission[]>({
    queryKey: ['/api/missions/completed'],
    queryFn: async () => {
      const response = await fetch('/api/missions/completed', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch completed missions');
      return response.json();
    },
  });

  const { data: rewards = [], isLoading: rewardsLoading } = useQuery<Reward[]>({
    queryKey: ['/api/rewards'],
  });

  // Mutation to undo a completed mission (only for parents)
  const undoMissionMutation = useMutation({
    mutationFn: async (missionId: number) => {
      const response = await fetch(`/api/missions/${missionId}/undo`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to undo mission');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/missions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/missions/completed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Mission zurückgegeben",
        description: "Die Aufgabe wurde wieder als offen markiert.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Aufgabe konnte nicht zurückgegeben werden.",
        variant: "destructive",
      });
    },
  });

  if (userLoading || activeMissionsLoading || completedMissionsLoading || rewardsLoading) {
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

  const allMissions = [...activeMissions, ...completedMissions];
  const completionRate = allMissions.length > 0 ? (completedMissions.length / allMissions.length) * 100 : 0;
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
          
          <div className="text-center p-4 bg-mission-purple/10 rounded-xl">
            <p className="text-3xl font-bold text-mission-purple">{Math.round(completionRate)}%</p>
            <p className="text-sm text-gray-600 mt-1">Erfolgsrate</p>
          </div>
          
          <div className="text-center p-4 bg-purple-100 rounded-xl">
            <p className="text-3xl font-bold text-purple-600">{availableRewards.length}</p>
            <p className="text-sm text-gray-600 mt-1">Belohnungen</p>
          </div>
        </div>
      </div>

      {/* Active Missions */}
      {activeMissions.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-mission-text mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-mission-blue" />
            Aktive Missionen ({activeMissions.length})
          </h2>
          
          <div className="space-y-3">
            {activeMissions.map((mission) => (
              <div key={mission.id} className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="w-10 h-10 bg-mission-blue rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-mission-text">{mission.title}</p>
                  <p className="text-sm text-gray-600">{mission.description}</p>
                </div>
                <div className="text-right">
                  <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                    Offen
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    +{mission.xpReward} XP
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Missions */}
      {completedMissions.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-mission-text mb-4 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-mission-green" />
            Erledigte Missionen ({completedMissions.length})
            {mode === 'parent' && (
              <span className="ml-2 text-sm text-gray-500 font-normal">
                (Als Eltern können Sie Aufgaben zurückgeben)
              </span>
            )}
          </h2>
          
          <div className="space-y-3">
            {completedMissions.map((mission) => (
              <div key={mission.id} className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="w-10 h-10 bg-mission-green rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-mission-text">{mission.title}</p>
                  <p className="text-sm text-gray-600">{mission.description}</p>
                  {mission.completedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Erledigt am: {new Date(mission.completedAt).toLocaleDateString('de-DE')}
                    </p>
                  )}
                </div>
                <div className="text-right flex items-center space-x-2">
                  <div>
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                      ✅ Erledigt
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      +{mission.xpReward} XP
                    </div>
                  </div>
                  {mode === 'parent' && (
                    <button
                      onClick={() => undoMissionMutation.mutate(mission.id)}
                      disabled={undoMissionMutation.isPending}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Aufgabe zurückgeben"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mission Status Summary */}
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