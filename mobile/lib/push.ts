import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { api } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerDeviceForPush(): Promise<void> {
  if (!Device.isDevice) return; // simulator/emulator cannot receive Expo push

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Standard",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#059669",
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== "granted") {
    const { status: requested } = await Notifications.requestPermissionsAsync();
    status = requested;
  }
  if (status !== "granted") return;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants.easConfig as { projectId?: string } | undefined)?.projectId;

  let tokenString: string | null = null;
  try {
    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    tokenString = token.data;
  } catch (err) {
    console.warn("[push] getExpoPushTokenAsync failed", err);
    return;
  }

  if (!tokenString) return;

  try {
    await api("/api/user/push-token", {
      method: "POST",
      body: { token: tokenString },
    });
  } catch (err) {
    console.warn("[push] token upload failed", err);
  }
}

export async function clearDevicePushRegistration(): Promise<void> {
  try {
    await api("/api/user/push-token", { method: "POST", body: { token: null } });
  } catch {
    // best effort
  }
}
