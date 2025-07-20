import { Plus, Trophy, Users, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CompletedMissions } from './CompletedMissions';

export function ParentControls() {
  const { toast } = useToast();

  const handleAction = (action: string) => {
    toast({
      title: action,
      description: "Funktion wird implementiert!",
    });
  };

  return (
    <div className="space-y-6">
      {/* Erledigte Aufgaben für Eltern */}
      <CompletedMissions />
      
      {/* Eltern-Kontrollen */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-mission-text mb-4">Eltern-Kontrollen</h2>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => handleAction("Aufgabe erstellen")}
            className="bg-mission-blue text-white p-4 rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-6 w-6 mb-2 mx-auto" />
            Aufgabe erstellen
          </button>
          
          <button 
            onClick={() => handleAction("Belohnungen verwalten")}
            className="bg-mission-purple text-white p-4 rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            <Trophy className="h-6 w-6 mb-2 mx-auto" />
            Belohnungen
          </button>
          
          <button 
            onClick={() => handleAction("Kinder verwalten")}
            className="bg-mission-green text-white p-4 rounded-xl font-medium hover:bg-green-600 transition-colors"
          >
            <Users className="h-6 w-6 mb-2 mx-auto" />
            Kinder verwalten
          </button>
          
          <button 
            onClick={() => handleAction("Statistiken anzeigen")}
            className="bg-gray-600 text-white p-4 rounded-xl font-medium hover:bg-gray-700 transition-colors"
          >
            <BarChart3 className="h-6 w-6 mb-2 mx-auto" />
            Statistiken
          </button>
        </div>
      </div>
    </div>
  );
}
