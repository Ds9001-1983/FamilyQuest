// Send an Expo push notification. Uses the public Expo push service — no SDK
// needed. Errors are logged, never thrown (notifications are best-effort).
// https://docs.expo.dev/push-notifications/sending-notifications/

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default";
  priority?: "default" | "high";
};

export async function sendPush(messages: ExpoPushMessage[]): Promise<void> {
  const valid = messages.filter((m) => m.to && m.to.startsWith("ExponentPushToken["));
  if (valid.length === 0) return;

  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(valid),
    });

    if (!res.ok) {
      console.error("[push] HTTP", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("[push] dispatch failed", err);
  }
}
