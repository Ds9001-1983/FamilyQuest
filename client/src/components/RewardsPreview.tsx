import { Gift, Gamepad2, IceCream } from 'lucide-react';
import type { Reward, User } from '@shared/schema';

interface RewardsPreviewProps {
  rewards: Reward[];
  user: User;
}

export function RewardsPreview({ rewards, user }: RewardsPreviewProps) {
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'film':
        return <Gift className="h-6 w-6 text-white" />;
      case 'gamepad2':
        return <Gamepad2 className="h-6 w-6 text-white" />;
      case 'ice-cream':
        return <IceCream className="h-6 w-6 text-white" />;
      default:
        return <Gift className="h-6 w-6 text-white" />;
    }
  };

  const sortedRewards = rewards
    .filter(reward => reward.requiredXP > user.totalXP)
    .sort((a, b) => a.requiredXP - b.requiredXP);

  const nextReward = sortedRewards[0];
  const futureRewards = sortedRewards.slice(1, 3);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-mission-text mb-4">Kommende Belohnungen</h2>
      
      {sortedRewards.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Alle Belohnungen erreicht!</p>
          <p className="text-sm mt-1">Du bist ein wahrer Champion! 🏆</p>
        </div>
      ) : (
        <div className="space-y-3">
          {nextReward && (
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-mission-yellow/10 to-mission-green/10 rounded-xl border border-mission-yellow/20">
              <div className="w-12 h-12 bg-mission-yellow rounded-full flex items-center justify-center">
                {getIconComponent(nextReward.icon)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-mission-text">{nextReward.name}</p>
                <p className="text-sm text-gray-600">{nextReward.requiredXP} XP benötigt</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-mission-green">Nächste</p>
              </div>
            </div>
          )}

          {futureRewards.map((reward) => (
            <div key={reward.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-mission-blue rounded-full flex items-center justify-center">
                {getIconComponent(reward.icon)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-mission-text">{reward.name}</p>
                <p className="text-sm text-gray-600">{reward.requiredXP} XP benötigt</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
