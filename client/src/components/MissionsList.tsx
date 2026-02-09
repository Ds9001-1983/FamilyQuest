import { useState } from 'react';
import { Check, Home, Book, Heart, Star, Clock, Loader2, ChevronDown, ChevronUp, Sparkles, Dumbbell, Palette, Dog } from 'lucide-react';
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
  const [expandedMission, setExpandedMission] = useState<number | null>(null);

  const submitMissionMutation = useMutation({
    mutationFn: async (missionId: number) => {
      const response = await apiRequest('POST', `/api/missions/${missionId}/submit`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Super gemacht!",
        description: "Warte auf Mama oder Papa",
        className: "bg-amber-500 text-white",
      });

      queryClient.invalidateQueries({ queryKey: ['/api/missions'] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Das hat nicht geklappt. Versuch es nochmal!",
        variant: "destructive",
      });
    },
  });

  const handleSubmitMission = (missionId: number) => {
    submitMissionMutation.mutate(missionId);
  };

  const getIconComponent = (iconName: string) => {
    const iconClass = "h-6 w-6";
    switch (iconName) {
      case 'home':
        return <Home className={`${iconClass} text-blue-500`} />;
      case 'book':
        return <Book className={`${iconClass} text-purple-600`} />;
      case 'paw':
      case 'dog':
        return <Dog className={`${iconClass} text-amber-600`} />;
      case 'heart':
        return <Heart className={`${iconClass} text-pink-500`} />;
      case 'sport':
        return <Dumbbell className={`${iconClass} text-green-600`} />;
      case 'creative':
        return <Palette className={`${iconClass} text-orange-500`} />;
      case 'star':
      default:
        return <Star className={`${iconClass} text-yellow-500`} />;
    }
  };

  // Separate pending and pending_approval missions
  const pendingMissions = missions.filter(m => m.status === 'pending');
  const pendingApprovalMissions = missions.filter(m => m.status === 'pending_approval');

  const toggleExpanded = (missionId: number) => {
    setExpandedMission(expandedMission === missionId ? null : missionId);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-mission-text">Deine Missionen</h2>
        <span className="bg-purple-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
          {pendingMissions.length} offen
        </span>
      </div>

      {/* Pending Approval Section - Waiting for parents */}
      {pendingApprovalMissions.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Clock className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-semibold text-amber-600">
              Warte auf Mama oder Papa
            </span>
          </div>
          <div className="space-y-3">
            {pendingApprovalMissions.map((mission) => (
              <div key={mission.id} className="flex items-center p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                <div className="w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center mr-4">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-amber-800 text-base">{mission.title}</p>
                  <p className="text-sm text-amber-600">+{mission.xpReward} XP kommen bald!</p>
                </div>
                <Sparkles className="h-6 w-6 text-amber-400 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Missions */}
      {pendingMissions.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <Sparkles className="h-12 w-12 mx-auto mb-3 text-green-400" />
          <p className="text-lg font-medium">Alle Aufgaben erledigt!</p>
          <p className="text-sm mt-1">Du bist ein Star!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingMissions.map((mission) => (
            <div key={mission.id} className="bg-gray-50 rounded-2xl overflow-hidden">
              {/* Main mission row */}
              <div className="flex items-center p-4">
                {/* Complete button - Large touch target (56px = 14 * 4) */}
                <button
                  onClick={() => handleSubmitMission(mission.id)}
                  disabled={submitMissionMutation.isPending}
                  className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center hover:bg-green-600 active:scale-95 transition-all disabled:opacity-50 mr-4 shadow-md flex-shrink-0"
                  aria-label={`${mission.title} als erledigt markieren`}
                >
                  {submitMissionMutation.isPending ? (
                    <Loader2 className="h-7 w-7 text-white animate-spin" />
                  ) : (
                    <Check className="h-7 w-7 text-white" strokeWidth={3} />
                  )}
                </button>

                {/* Mission info */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => mission.description && toggleExpanded(mission.id)}
                >
                  <p className="font-semibold text-mission-text text-base truncate">{mission.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium text-green-600">+{mission.xpReward} XP</span>
                    {mission.description && (
                      <span className="text-xs text-gray-400 flex items-center">
                        {expandedMission === mission.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        Details
                      </span>
                    )}
                  </div>
                </div>

                {/* Icon */}
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ml-3">
                  {getIconComponent(mission.icon)}
                </div>
              </div>

              {/* Expanded description */}
              {mission.description && expandedMission === mission.id && (
                <div className="px-4 pb-4 pt-0">
                  <div className="bg-white rounded-xl p-3 text-sm text-gray-600 border border-gray-100">
                    {mission.description}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
