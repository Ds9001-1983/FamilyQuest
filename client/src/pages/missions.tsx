import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { XPProgress } from '@/components/XPProgress';
import { MissionsList } from '@/components/MissionsList';
import { VoiceControl } from '@/components/VoiceControl';
import { ParentControls } from '@/components/ParentControls';
import { RewardsPreview } from '@/components/RewardsPreview';
import { RewardCelebration } from '@/components/RewardCelebration';
import { useAppState } from '@/hooks/use-app-state';
import { Skeleton } from '@/components/ui/skeleton';
import type { User, Mission, Reward } from '@shared/schema';

export default function Missions() {
  const { mode, currentUserId } = useAppState();
  const [showCelebration, setShowCelebration] = useState(false);
  const [newReward, setNewReward] = useState<Reward | null>(null);
  const [lastKnownXP, setLastKnownXP] = useState<number | null>(null);

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  const { data: missions = [], isLoading: missionsLoading } = useQuery<Mission[]>({
    queryKey: mode === 'parent' ? ['/api/missions/completed'] : ['/api/missions', currentUserId],
    queryFn: async () => {
      const url = mode === 'parent' 
        ? '/api/missions/completed'
        : `/api/missions?userId=${currentUserId}`;
      
      console.log('Fetching missions from:', url, 'mode:', mode);
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch missions');
      const data = await response.json();
      console.log('Received missions data:', data);
      return data;
    },
  });

  const { data: rewards = [], isLoading: rewardsLoading } = useQuery<Reward[]>({
    queryKey: ['/api/rewards'],
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

      {/* Current Missions Section */}
      {mode === 'parent' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">👨‍👩‍👧‍👦 Eltern-Übersicht</h3>
          <p className="text-blue-600 text-sm">Hier siehst du alle erledigten Aufgaben deiner Kinder.</p>
        </div>
      )}
      
      {missionsLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mission-green"></div>
        </div>
      ) : missions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {mode === 'parent' 
            ? "Noch keine Aufgaben erledigt 📝" 
            : "Keine Missionen verfügbar 🎉"
          }
        </div>
      ) : mode === 'parent' ? (
        <div className="space-y-3">
          {missions.map((mission) => (
            <div key={mission.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-800">{mission.title}</h3>
                  <p className="text-sm text-green-600">{mission.description}</p>
                </div>
                <div className="text-right">
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                    ✅ Erledigt
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    +{mission.xpReward} XP
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
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
