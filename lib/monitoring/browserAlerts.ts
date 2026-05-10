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
    vibration: "vibrate" in navigator,
    notifications: "Notification" in window,
  };
}

export async function enableBrowserAlerts(): Promise<BrowserAlertSupport> {
  const support = getBrowserAlertSupport();

  vibrateForSeverity("attention");

  if (support.notifications && Notification.permission === "default") {
    await Notification.requestPermission();
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

  if ("Notification" in window && Notification.permission === "granted") {
    const options: VibratingNotificationOptions = {
      body,
      icon: "/favicon.ico",
      tag: `holy-motion-${severity}`,
      renotify: true,
      vibrate: getVibrationPattern(severity),
    };

    new Notification(title, options);
  }
}

export function vibrateForSeverity(severity: AlertLevel) {
  if (!("vibrate" in navigator)) {
    return;
  }

  navigator.vibrate(getVibrationPattern(severity));
}

export function stopVibration() {
  if ("vibrate" in navigator) {
    navigator.vibrate(0);
  }
}

function getVibrationPattern(severity: AlertLevel) {
  return severity === "critical" ? [300, 120, 300, 120, 600] : [180, 90, 180];
}
