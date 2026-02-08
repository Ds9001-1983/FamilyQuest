import { useState } from "react";
import { useAppState } from "@/hooks/use-app-state";
import { PinDialog } from "./PinDialog";

export function ModeToggle() {
  const { mode, deviceType } = useAppState();
  const [showPinDialog, setShowPinDialog] = useState(false);

  // On child devices, only show a small lock icon to access parent mode
  const isChildDevice = deviceType === "child";

  const handleToggle = () => {
    if (mode === "child") {
      // Switching to parent mode requires PIN
      setShowPinDialog(true);
    } else {
      // Switching back to child mode - no PIN needed
      localStorage.setItem("levelMissionMode", "child");
      window.location.reload();
    }
  };

  const handlePinSuccess = () => {
    localStorage.setItem("levelMissionMode", "parent");
    window.location.reload();
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          mode === "parent"
            ? "bg-mission-green text-white"
            : isChildDevice
            ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        {mode === "parent" ? (
          "Eltern-Modus"
        ) : isChildDevice ? (
          "Eltern"
        ) : (
          "Kind-Modus"
        )}
      </button>

      <PinDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        onSuccess={handlePinSuccess}
      />
    </>
  );
}
