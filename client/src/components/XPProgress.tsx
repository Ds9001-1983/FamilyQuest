import { Star } from 'lucide-react';
import { formatXP, calculateProgress, getNextReward } from '@/lib/utils';
import type { User, Reward } from '@shared/schema';

interface XPProgressProps {
  user: User;
  rewards: Reward[];
}

export function XPProgress({ user, rewards }: XPProgressProps) {
  const nextReward = getNextReward(rewards, user.totalXP);
  const remaining = nextReward ? nextReward.requiredXP - user.totalXP : 0;
  const progressPercent = nextReward ? calculateProgress(user.totalXP, nextReward.requiredXP) : 100;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-mission-text">Deine XP</h2>
          <p className="text-3xl font-bold text-mission-green">{formatXP(user.totalXP)}</p>
        </div>
        <div className="w-16 h-16 bg-gradient-to-br from-mission-yellow to-mission-green rounded-full flex items-center justify-center">
          <Star className="h-8 w-8 text-white fill-current" />
        </div>
      </div>
      
      {nextReward && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Bis zur nächsten Belohnung</span>
            <span className="font-semibold text-mission-text">{remaining} XP</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-mission-green to-mission-blue h-3 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            🎬 {nextReward.name} bei {nextReward.requiredXP} XP
          </p>
        </div>
      )}
    </div>
  );
}
