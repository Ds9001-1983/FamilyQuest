import { Check, Home, Book, Heart } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getIcon } from '@/lib/utils';
import type { Mission } from '@shared/schema';

interface MissionsListProps {
  missions: Mission[];
  currentUserId: number;
}

export function MissionsList({ missions, currentUserId }: MissionsListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const completeMissionMutation = useMutation({
    mutationFn: async (missionId: number) => {
      const response = await apiRequest('POST', `/api/missions/${missionId}/complete`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Mission erfüllt! 🎉",
        description: `+${data.mission.xpReward} XP erhalten`,
        className: "bg-mission-green text-white",
      });
      
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['/api/missions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Mission konnte nicht abgeschlossen werden",
        variant: "destructive",
      });
    },
  });

  const handleCompleteMission = (missionId: number) => {
    completeMissionMutation.mutate(missionId);
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'home':
        return <Home className="h-5 w-5 text-mission-blue" />;
      case 'book':
        return <Book className="h-5 w-5 text-mission-yellow" />;
      case 'paw':
        return <Heart className="h-5 w-5 text-mission-green" />;
      default:
        return <Home className="h-5 w-5 text-mission-blue" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-mission-text">Deine Missionen</h2>
        <span className="bg-mission-yellow text-white text-xs font-semibold px-2 py-1 rounded-full">
          {missions.length} offen
        </span>
      </div>
      
      {missions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Keine offenen Missionen</p>
          <p className="text-sm mt-1">Super! Du hast alle Aufgaben erledigt! 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {missions.map((mission) => (
            <div key={mission.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
              <button
                onClick={() => handleCompleteMission(mission.id)}
                disabled={completeMissionMutation.isPending}
                className="w-8 h-8 bg-mission-green rounded-full flex items-center justify-center hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <Check className="h-4 w-4 text-white" />
              </button>
              <div className="flex-1">
                <p className="font-medium text-mission-text">{mission.title}</p>
                <p className="text-sm text-gray-600">+{mission.xpReward} XP</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                {getIconComponent(mission.icon)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
