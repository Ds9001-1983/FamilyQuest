import { Plus, Trophy, BarChart3 } from 'lucide-react';
import { CompletedMissions } from './CompletedMissions';
import { CreateMissionDialog } from './CreateMissionDialog';
import { useAppState } from '@/hooks/use-app-state';

export function ParentControls() {
  const { currentUserId } = useAppState();

  return (
    <div className="space-y-6">
      {/* Erledigte Aufgaben für Eltern */}
      <CompletedMissions />

      {/* Eltern-Kontrollen */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-mission-text mb-4">Schnellaktionen</h2>

        <div className="grid grid-cols-2 gap-3">
          {/* Aufgabe erstellen - funktioniert! */}
          <CreateMissionDialog
            currentUserId={currentUserId}
            trigger={
              <button className="bg-purple-600 text-white p-4 rounded-xl font-medium hover:bg-purple-700 transition-colors min-h-[88px]">
                <Plus className="h-7 w-7 mb-2 mx-auto" />
                <span className="text-sm">Neue Aufgabe</span>
              </button>
            }
          />

          {/* Belohnungen - Link zu /rewards */}
          <a
            href="/rewards"
            className="bg-amber-500 text-white p-4 rounded-xl font-medium hover:bg-amber-600 transition-colors min-h-[88px] flex flex-col items-center justify-center"
          >
            <Trophy className="h-7 w-7 mb-2" />
            <span className="text-sm">Belohnungen</span>
          </a>

          {/* Statistiken - Link zu /progress */}
          <a
            href="/progress"
            className="bg-blue-600 text-white p-4 rounded-xl font-medium hover:bg-blue-700 transition-colors min-h-[88px] flex flex-col items-center justify-center col-span-2"
          >
            <BarChart3 className="h-7 w-7 mb-2" />
            <span className="text-sm">Fortschritt ansehen</span>
          </a>
        </div>
      </div>
    </div>
  );
}
