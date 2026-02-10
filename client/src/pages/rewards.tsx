import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift, Trophy, Star, Check, X, Loader2, Clock, ShoppingBag } from 'lucide-react';
import { useAppState } from '@/hooks/use-app-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CreateRewardDialog } from '@/components/CreateRewardDialog';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { User, Reward, RedeemedReward } from '@shared/schema';

interface EnrichedRedemption extends RedeemedReward {
  reward?: Reward;
  user?: User;
}

export default function Rewards() {
  const { currentUserId, mode } = useAppState();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  const { data: rewards = [], isLoading: rewardsLoading } = useQuery<Reward[]>({
    queryKey: ['/api/rewards'],
  });

  // Pending redemptions for parent mode
  const { data: pendingRedemptions = [] } = useQuery<EnrichedRedemption[]>({
    queryKey: ['/api/redemptions/pending'],
    queryFn: async () => {
      const response = await fetch('/api/redemptions/pending', { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: mode === 'parent',
  });

  // Redeem mutation for children
  const redeemMutation = useMutation({
    mutationFn: async ({ rewardId, userId }: { rewardId: number; userId: number }) => {
      const response = await apiRequest('POST', `/api/rewards/${rewardId}/redeem`, { userId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Belohnung eingelöst!",
        description: "Warte auf Mama oder Papa",
        className: "bg-amber-500 text-white",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rewards'] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Das hat nicht geklappt",
        variant: "destructive",
      });
    },
  });

  // Approve/Reject redemption mutations for parents
  const approveMutation = useMutation({
    mutationFn: async (redemptionId: number) => {
      const response = await apiRequest('POST', `/api/redemptions/${redemptionId}/approve`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Belohnung bestätigt!",
        description: "Die Belohnung wurde freigegeben",
        className: "bg-green-600 text-white",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/redemptions/pending'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (redemptionId: number) => {
      const response = await apiRequest('POST', `/api/redemptions/${redemptionId}/reject`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Belohnung abgelehnt",
        description: "XP wurden zurückgegeben",
        className: "bg-amber-500 text-white",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/redemptions/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
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

      {/* Parent Mode: Pending Redemptions */}
      {mode === 'parent' && pendingRedemptions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-amber-800">Einlösungen zur Prüfung</h3>
            <span className="bg-amber-600 text-white text-xs px-2 py-0.5 rounded-full">
              {pendingRedemptions.length}
            </span>
          </div>
          <div className="space-y-3">
            {pendingRedemptions.map((redemption) => (
              <div key={redemption.id} className="bg-white rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center">
                    <Gift className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{redemption.reward?.name}</p>
                    <p className="text-sm text-gray-500">
                      {redemption.user?.name} - {redemption.xpSpent} XP
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50 h-12 w-12 p-0"
                    onClick={() => rejectMutation.mutate(redemption.id)}
                    disabled={rejectMutation.isPending || approveMutation.isPending}
                  >
                    {rejectMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <X className="h-5 w-5" />
                    )}
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white h-12 px-5"
                    onClick={() => approveMutation.mutate(redemption.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-5 w-5 mr-1" />
                        OK
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
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
              <div key={reward.id} className="flex items-center space-x-3 p-4 bg-gradient-to-r from-mission-green/10 to-green-500/10 rounded-xl border border-mission-green/20">
                <div className="w-12 h-12 bg-mission-green rounded-full flex items-center justify-center flex-shrink-0">
                  <Gift className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-mission-text">{reward.name}</p>
                  <p className="text-sm text-gray-600 truncate">{reward.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{reward.requiredXP} XP</p>
                </div>
                {mode === 'child' && (
                  <Button
                    onClick={() => user && redeemMutation.mutate({ rewardId: reward.id, userId: user.id })}
                    disabled={redeemMutation.isPending}
                    className="bg-mission-green hover:bg-green-600 text-white h-14 px-4 rounded-xl flex-shrink-0"
                  >
                    {redeemMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <ShoppingBag className="h-5 w-5 mr-1" />
                        Einlösen
                      </>
                    )}
                  </Button>
                )}
                {mode === 'parent' && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-mission-green">Verfügbar</p>
                  </div>
                )}
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
