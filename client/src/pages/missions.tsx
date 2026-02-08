import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { XPProgress } from '@/components/XPProgress';
import { MissionsList } from '@/components/MissionsList';
import { VoiceControl } from '@/components/VoiceControl';
import { ParentControls } from '@/components/ParentControls';
import { RewardsPreview } from '@/components/RewardsPreview';
import { RewardCelebration } from '@/components/RewardCelebration';
import { useAppState } from '@/hooks/use-app-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Check, X, Clock, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { User, Mission, Reward } from '@shared/schema';

// Polling interval in milliseconds (10 seconds)
const POLLING_INTERVAL = 10000;

export default function Missions() {
  const { mode, currentUserId } = useAppState();
  const [showCelebration, setShowCelebration] = useState(false);
  const [newReward, setNewReward] = useState<Reward | null>(null);
  const [lastKnownXP, setLastKnownXP] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/user'],
    refetchInterval: POLLING_INTERVAL,
  });

  // For child mode: get all active missions
  // For parent mode: get pending approval missions
  const { data: missions = [], isLoading: missionsLoading } = useQuery<Mission[]>({
    queryKey: mode === 'parent' ? ['/api/missions/pending-approval'] : ['/api/missions'],
    queryFn: async () => {
      const url = mode === 'parent'
        ? '/api/missions/pending-approval'
        : '/api/missions';

      const response = await fetch(url, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch missions');
      return response.json();
    },
    refetchInterval: POLLING_INTERVAL,
  });

  const { data: rewards = [], isLoading: rewardsLoading } = useQuery<Reward[]>({
    queryKey: ['/api/rewards'],
  });

  // Approve mission mutation
  const approveMutation = useMutation({
    mutationFn: async (missionId: number) => {
      const response = await apiRequest('POST', `/api/missions/${missionId}/approve`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Mission genehmigt!",
        description: `${data.mission.xpReward} XP wurden vergeben`,
        className: "bg-green-600 text-white",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/missions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/missions/pending-approval'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Mission konnte nicht genehmigt werden",
        variant: "destructive",
      });
    },
  });

  // Reject mission mutation
  const rejectMutation = useMutation({
    mutationFn: async (missionId: number) => {
      const response = await apiRequest('POST', `/api/missions/${missionId}/reject`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mission zurückgewiesen",
        description: "Die Aufgabe muss nochmal erledigt werden",
        className: "bg-amber-500 text-white",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/missions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/missions/pending-approval'] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Mission konnte nicht zurückgewiesen werden",
        variant: "destructive",
      });
    },
  });

  // Check for new rewards when XP changes (only in child mode)
  useEffect(() => {
    if (mode === 'child' && user && rewards.length > 0) {
      if (lastKnownXP !== null && user.totalXP > lastKnownXP) {
        // Find newly unlocked rewards
        const availableRewards = rewards.filter(reward =>
          reward.requiredXP <= user.totalXP && reward.requiredXP > lastKnownXP
        );

        if (availableRewards.length > 0) {
          // Show celebration for the first new reward
          setNewReward(availableRewards[0]);
          setShowCelebration(true);
        }
      }
      setLastKnownXP(user.totalXP);
    }
  }, [user?.totalXP, rewards, lastKnownXP, mode]);

  if (userLoading || missionsLoading || rewardsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-full" />
        <Skeleton className="h-64 w-full rounded-2xl" />
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
      {/* XP Progress Section */}
      <XPProgress user={user} rewards={rewards} />

      {/* Voice Control Button */}
      <VoiceControl />

      {/* Parent Mode: Pending Approval Missions */}
      {mode === 'parent' && (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-purple-800">Zur Prüfung</h3>
              {missions.length > 0 && (
                <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {missions.length}
                </span>
              )}
            </div>
            <p className="text-purple-600 text-sm">
              Diese Aufgaben wurden von deinen Kindern als erledigt markiert.
            </p>
          </div>

          {missions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-white rounded-2xl">
              <p>Keine Aufgaben zur Prüfung</p>
              <p className="text-sm mt-1">Neue Einreichungen erscheinen hier automatisch</p>
            </div>
          ) : (
            <div className="space-y-3">
              {missions.map((mission) => (
                <div key={mission.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{mission.title}</h3>
                      {mission.description && (
                        <p className="text-sm text-gray-600 mt-1">{mission.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                          +{mission.xpReward} XP
                        </span>
                        <span className="text-xs text-gray-500">
                          Eingereicht: {mission.submittedAt
                            ? new Date(mission.submittedAt).toLocaleString('de-DE', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Unbekannt'
                          }
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => rejectMutation.mutate(mission.id)}
                        disabled={rejectMutation.isPending || approveMutation.isPending}
                      >
                        {rejectMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => approveMutation.mutate(mission.id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                      >
                        {approveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            OK
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Child Mode: Mission List */}
      {mode === 'child' && (
        <MissionsList missions={missions} currentUserId={currentUserId} />
      )}

      {/* Rewards Preview Section */}
      <RewardsPreview rewards={rewards} user={user} />

      {/* Parent Mode Controls */}
      {mode === 'parent' && <ParentControls />}

      {/* Reward Celebration (only in child mode) */}
      {mode === 'child' && newReward && (
        <RewardCelebration
          isVisible={showCelebration}
          onClose={() => {
            setShowCelebration(false);
            setNewReward(null);
          }}
          rewardName={newReward?.name || ""}
          rewardDescription={newReward?.description || ""}
        />
      )}
    </div>
  );
}
