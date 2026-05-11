import type { MotionSeverity } from "@/lib/monitoring/motionAnalysis";

type AlertLevel = Exclude<MotionSeverity, "normal">;

export type BrowserAlertSupport = {
  serviceWorker: boolean;
  vibration: boolean;
  notifications: boolean;
};

type VibratingNotificationOptions = NotificationOptions & {
  renotify?: boolean;
  vibrate?: number[];
};

export function getBrowserAlertSupport(): BrowserAlertSupport {
  return {
    serviceWorker:
      typeof navigator !== "undefined" && "serviceWorker" in navigator,
    vibration: typeof navigator !== "undefined" && "vibrate" in navigator,
    notifications: typeof window !== "undefined" && "Notification" in window,
  };
}

export async function registerPwaServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

export async function enableBrowserAlerts(): Promise<BrowserAlertSupport> {
  const support = getBrowserAlertSupport();

  vibrateForSeverity("attention");

  const registration = await registerPwaServiceWorker();

  try {
    if (support.notifications && Notification.permission === "default") {
      await Notification.requestPermission();
    }

    if (registration && Notification.permission === "granted") {
      await registration.showNotification("Alertas Holy Motion ativos", {
        body: "Este celular vai receber alertas enquanto a tela remota estiver aberta.",
        icon: "/pwa-icon.svg",
        badge: "/pwa-icon.svg",
        tag: "holy-motion-alerts-enabled",
        silent: true,
        data: {
          url: getCurrentPath(),
        },
      });
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
  void showBrowserNotification({ title, body, severity });
}

async function showBrowserNotification({
  title,
  body,
  severity,
}: {
  title: string;
  body: string;
  severity: AlertLevel;
}) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const options: VibratingNotificationOptions = {
      body,
      icon: "/pwa-icon.svg",
      badge: "/pwa-icon.svg",
      tag: `holy-motion-${severity}`,
      renotify: true,
      vibrate: getVibrationPattern(severity),
      requireInteraction: severity === "critical",
      data: {
        url: getCurrentPath(),
      },
    };

    const registration = await getReadyServiceWorkerRegistration();

    if (registration) {
      await registration.showNotification(title, options);
      return;
    }

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

async function getReadyServiceWorkerRegistration() {
  const registration = await registerPwaServiceWorker();

  if (registration) {
    return registration;
  }

  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

function getCurrentPath() {
  if (typeof window === "undefined") {
    return "/remote/holy-motion-001";
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}
