import { Check, Home, Book, Heart, Clock, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Mission } from '@shared/schema';

interface MissionsListProps {
  missions: Mission[];
  currentUserId: number;
}

export function MissionsList({ missions, currentUserId }: MissionsListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitMissionMutation = useMutation({
    mutationFn: async (missionId: number) => {
      const response = await apiRequest('POST', `/api/missions/${missionId}/submit`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Zur Prüfung eingereicht!",
        description: "Warte auf die Bestätigung deiner Eltern",
        className: "bg-amber-500 text-white",
      });

      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['/api/missions'] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Mission konnte nicht eingereicht werden",
        variant: "destructive",
      });
    },
  });

  const handleSubmitMission = (missionId: number) => {
    submitMissionMutation.mutate(missionId);
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'home':
        return <Home className="h-5 w-5 text-mission-blue" />;
      case 'book':
        return <Book className="h-5 w-5 text-purple-600" />;
      case 'paw':
        return <Heart className="h-5 w-5 text-mission-green" />;
      default:
        return <Home className="h-5 w-5 text-mission-blue" />;
    }
  };

  // Separate pending and pending_approval missions
  const pendingMissions = missions.filter(m => m.status === 'pending');
  const pendingApprovalMissions = missions.filter(m => m.status === 'pending_approval');

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-mission-text">Deine Missionen</h2>
        <span className="bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
          {pendingMissions.length} offen
        </span>
      </div>

      {/* Pending Approval Section */}
      {pendingApprovalMissions.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-600">Warten auf Bestätigung</span>
          </div>
          <div className="space-y-2">
            {pendingApprovalMissions.map((mission) => (
              <div key={mission.id} className="flex items-center space-x-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-amber-800">{mission.title}</p>
                  <p className="text-sm text-amber-600">+{mission.xpReward} XP (wenn bestätigt)</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Missions */}
      {pendingMissions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Keine offenen Missionen</p>
          <p className="text-sm mt-1">Super! Du hast alle Aufgaben erledigt!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingMissions.map((mission) => (
            <div key={mission.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
              <button
                onClick={() => handleSubmitMission(mission.id)}
                disabled={submitMissionMutation.isPending}
                className="w-8 h-8 bg-mission-green rounded-full flex items-center justify-center hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {submitMissionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <Check className="h-4 w-4 text-white" />
                )}
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
