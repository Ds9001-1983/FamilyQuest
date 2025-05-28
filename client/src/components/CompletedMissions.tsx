import { CheckCircle, Home, Book, Heart, Calendar, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import type { Mission } from '@shared/schema';

export function CompletedMissions() {
  const { data: allMissions = [], isLoading } = useQuery<Mission[]>({
    queryKey: ['/api/missions/all'],
    queryFn: async () => {
      const response = await fetch('/api/missions', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch missions');
      return response.json();
    },
  });

  const completedMissions = allMissions
    .filter(mission => mission.completed)
    .sort((a, b) => {
      if (!a.completedAt || !b.completedAt) return 0;
      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
    });

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'home':
        return <Home className="h-5 w-5 text-mission-blue" />;
      case 'book':
        return <Book className="h-5 w-5 text-mission-yellow" />;
      case 'paw':
        return <Heart className="h-5 w-5 text-mission-green" />;
      case 'tasks':
        return <Star className="h-5 w-5 text-purple-600" />;
      default:
        return <Home className="h-5 w-5 text-mission-blue" />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-mission-text flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 text-mission-green" />
          Erledigte Aufgaben
        </h2>
        <span className="bg-mission-green text-white text-xs font-semibold px-2 py-1 rounded-full">
          {completedMissions.length} erledigt
        </span>
      </div>
      
      {completedMissions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Noch keine erledigten Aufgaben</p>
          <p className="text-sm mt-1">Hier erscheinen abgeschlossene Missionen zur Überprüfung</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {completedMissions.map((mission) => (
            <div key={mission.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl border border-green-200">
              <div className="w-10 h-10 bg-mission-green rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-mission-text">{mission.title}</p>
                  <div className="flex items-center space-x-2">
                    <span className="bg-mission-green text-white text-xs font-semibold px-2 py-1 rounded-full">
                      +{mission.xpReward} XP
                    </span>
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      {getIconComponent(mission.icon)}
                    </div>
                  </div>
                </div>
                {mission.description && (
                  <p className="text-sm text-gray-600 mt-1">{mission.description}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {mission.completedAt 
                      ? new Date(mission.completedAt).toLocaleDateString('de-DE', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Unbekannt'
                    }
                  </p>
                  <button className="text-xs text-mission-green hover:text-green-700 font-medium">
                    ✓ Bestätigt
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}