import { useQuery } from '@tanstack/react-query';
import { XPProgress } from '@/components/XPProgress';
import { MissionsList } from '@/components/MissionsList';
import { VoiceControl } from '@/components/VoiceControl';
import { ParentControls } from '@/components/ParentControls';
import { RewardsPreview } from '@/components/RewardsPreview';
import { useAppState } from '@/hooks/use-app-state';
import { Skeleton } from '@/components/ui/skeleton';
import type { User, Mission, Reward } from '@shared/schema';

export default function Missions() {
  const { mode, currentUserId } = useAppState();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  const { data: missions = [], isLoading: missionsLoading } = useQuery<Mission[]>({
    queryKey: mode === 'parent' ? ['/api/missions/completed'] : ['/api/missions', currentUserId],
    queryFn: async () => {
      const url = mode === 'parent' 
        ? '/api/missions/completed'
        : `/api/missions?userId=${currentUserId}`;
      
      const response = await fetch(url, {
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
      <MissionsList missions={missions} currentUserId={currentUserId} />

      {/* Rewards Preview Section */}
      <RewardsPreview rewards={rewards} user={user} />

      {/* Parent Mode Controls */}
      {mode === 'parent' && <ParentControls />}
    </div>
  );
}
