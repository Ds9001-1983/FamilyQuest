import { useState } from "react";

export type AppMode = "child" | "parent";
export type DeviceType = "child" | "parent";

export function useAppState() {
  // Load initial mode from localStorage immediately
  const getInitialMode = (): AppMode => {
    const savedMode = localStorage.getItem("levelMissionMode") as AppMode;
    return savedMode === "parent" || savedMode === "child" ? savedMode : "child";
  };

  const getDeviceType = (): DeviceType => {
    const savedType = localStorage.getItem("levelMissionDeviceType") as DeviceType;
    return savedType === "parent" || savedType === "child" ? savedType : "parent";
  };

  const [mode, setMode] = useState<AppMode>(getInitialMode);
  const [deviceType] = useState<DeviceType>(getDeviceType);
  const [currentUserId] = useState(() => {
    const initialMode = getInitialMode();
    return initialMode === "child" ? 2 : 1;
  });

  const toggleMode = () => {
    const newMode = mode === "child" ? "parent" : "child";
    setMode(newMode);
    localStorage.setItem("levelMissionMode", newMode);
  };

  return {
    mode,
    deviceType,
    currentUserId,
    toggleMode,
  };
}
