import { Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function VoiceControl() {
  const { toast } = useToast();

  const handleVoiceControl = () => {
    toast({
      title: "Sprachsteuerung",
      description: "Funktion wird in Zukunft implementiert!",
    });
  };

  return (
    <div className="flex justify-center">
      <button 
        onClick={handleVoiceControl}
        className="bg-mission-blue hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <Mic className="h-6 w-6" />
      </button>
    </div>
  );
}
