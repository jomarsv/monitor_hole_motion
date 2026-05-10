import type { MotionSeverity } from "@/lib/monitoring/motionAnalysis";

type AlertLevel = Exclude<MotionSeverity, "normal">;

export type BrowserAlertSupport = {
  vibration: boolean;
  notifications: boolean;
};

type VibratingNotificationOptions = NotificationOptions & {
  renotify?: boolean;
  vibrate?: number[];
};

export function getBrowserAlertSupport(): BrowserAlertSupport {
  return {
    vibration: typeof navigator !== "undefined" && "vibrate" in navigator,
    notifications: typeof window !== "undefined" && "Notification" in window,
  };
}

export async function enableBrowserAlerts(): Promise<BrowserAlertSupport> {
  const support = getBrowserAlertSupport();

  vibrateForSeverity("attention");

  try {
    if (support.notifications && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  } catch {
    return {
      ...support,
      notifications: false,
    };
  }

  return support;
}

export function notifyBrowserAlert({
  title,
  body,
  severity,
}: {
  title: string;
  body: string;
  severity: AlertLevel;
}) {
  vibrateForSeverity(severity);

  try {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const options: VibratingNotificationOptions = {
      body,
      icon: "/favicon.ico",
      tag: `holy-motion-${severity}`,
      renotify: true,
      vibrate: getVibrationPattern(severity),
    };

    new Notification(title, options);
  } catch {
    // Android Chrome may expose Notification but reject constructor usage.
  }
}

export function vibrateForSeverity(severity: AlertLevel) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) {
    return;
  }

  try {
    navigator.vibrate(getVibrationPattern(severity));
  } catch {
    // Some mobile browsers expose the API but block vibration at runtime.
  }
}

export function stopVibration() {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) {
    return;
  }

  try {
    navigator.vibrate(0);
  } catch {
    // Ignore runtime vibration blocks.
  }
}

function getVibrationPattern(severity: AlertLevel) {
  return severity === "critical" ? [300, 120, 300, 120, 600] : [180, 90, 180];
}
