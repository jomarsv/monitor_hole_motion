import {
  addDoc,
  collection,
  deleteField,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import {
  ensureFirebaseAuth,
  getFirebaseAuthErrorMessage,
  getFirebaseDb,
} from "@/lib/firebase/client";
import type {
  RemoteAlertEvent,
  RemoteDeviceSettings,
  RemoteDeviceState,
  RemoteTelemetrySample,
} from "@/lib/monitoring/remoteTypes";

const TELEMETRY_HISTORY_LIMIT = 120;
const ALERT_HISTORY_LIMIT = 30;
const ALERT_HISTORY_PAGE_LIMIT = 200;
const TELEMETRY_CLEANUP_BATCH_LIMIT = 50;
export const TELEMETRY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export function isTelemetryRemoteConfigured(): boolean {
  return getFirebaseDb() !== null;
}

export async function publishTelemetrySample(
  sample: RemoteTelemetrySample,
): Promise<void> {
  const db = getFirebaseDb();

  if (!db) {
    return;
  }

  await ensureFirebaseAuth();

  const deviceRef = doc(db, "devices", sample.deviceId);
  const sanitizedSample = removeUndefinedValues(sample);

  await Promise.all([
    setDoc(
      deviceRef,
      {
        ...removeUndefinedValues({
          deviceId: sanitizedSample.deviceId,
          status: "online",
          bleStatus: sanitizedSample.bleStatus,
          lastSeenAt: sanitizedSample.timestamp,
          severity: sanitizedSample.severity,
          snapshot: sanitizedSample.snapshot,
          metrics: sanitizedSample.metrics,
        }),
        lastSeenServerAt: serverTimestamp(),
      },
      { merge: true },
    ),
    addDoc(collection(deviceRef, "telemetry"), {
      ...sanitizedSample,
      serverCreatedAt: serverTimestamp(),
    }),
  ]);
}

export async function publishAlertEvent(alert: RemoteAlertEvent): Promise<void> {
  const db = getFirebaseDb();

  if (!db) {
    return;
  }

  await ensureFirebaseAuth();

  const deviceRef = doc(db, "devices", alert.deviceId);
  const sanitizedAlert = removeUndefinedValues(alert);

  await addDoc(collection(deviceRef, "alerts"), {
    ...sanitizedAlert,
    serverCreatedAt: serverTimestamp(),
  });
}

export async function saveDeviceSettings(
  deviceId: string,
  settings: RemoteDeviceSettings,
): Promise<void> {
  const db = getFirebaseDb();

  if (!db) {
    return;
  }

  await ensureFirebaseAuth();

  const deviceRef = doc(db, "devices", deviceId);

  await setDoc(
    deviceRef,
    {
      deviceId,
      settings: {
        updatedAt: settings.updatedAt ?? Date.now(),
        restingEuler: settings.restingEuler ?? deleteField(),
      },
      settingsServerUpdatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function cleanupOldTelemetry(
  deviceId: string,
  retentionMs = TELEMETRY_RETENTION_MS,
): Promise<number> {
  const db = getFirebaseDb();

  if (!db) {
    return 0;
  }

  await ensureFirebaseAuth();

  const cutoff = Date.now() - retentionMs;
  const snapshot = await getDocs(
    query(
      collection(db, "devices", deviceId, "telemetry"),
      where("timestamp", "<", cutoff),
      orderBy("timestamp", "asc"),
      limit(TELEMETRY_CLEANUP_BATCH_LIMIT),
    ),
  );

  await Promise.all(snapshot.docs.map((document) => deleteDoc(document.ref)));

  return snapshot.size;
}

export function subscribeRemoteDevice(
  deviceId: string,
  onChange: (state: RemoteDeviceState | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const db = getFirebaseDb();

  if (!db) {
    onChange(null);
    return () => undefined;
  }

  return subscribeAfterAuth(
    () =>
      onSnapshot(
        doc(db, "devices", deviceId),
        (snapshot) => {
          onChange(
            snapshot.exists() ? (snapshot.data() as RemoteDeviceState) : null,
          );
        },
        onError,
      ),
    onError,
  );
}

export function subscribeDeviceSettings(
  deviceId: string,
  onChange: (settings: RemoteDeviceSettings | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const db = getFirebaseDb();

  if (!db) {
    onChange(null);
    return () => undefined;
  }

  return subscribeAfterAuth(
    () =>
      onSnapshot(
        doc(db, "devices", deviceId),
        (snapshot) => {
          if (!snapshot.exists()) {
            onChange(null);
            return;
          }

          const data = snapshot.data() as RemoteDeviceState;

          onChange(data.settings ?? null);
        },
        onError,
      ),
    onError,
  );
}

export function subscribeTelemetryHistory(
  deviceId: string,
  onChange: (samples: RemoteTelemetrySample[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const db = getFirebaseDb();

  if (!db) {
    onChange([]);
    return () => undefined;
  }

  return subscribeAfterAuth(
    () =>
      onSnapshot(
        query(
          collection(db, "devices", deviceId, "telemetry"),
          orderBy("timestamp", "desc"),
          limit(TELEMETRY_HISTORY_LIMIT),
        ),
        (snapshot) => {
          onChange(
            snapshot.docs
              .map((document) => ({
                id: document.id,
                ...(document.data() as RemoteTelemetrySample),
              }))
              .reverse(),
          );
        },
        onError,
      ),
    onError,
  );
}

export function subscribeAlertHistory(
  deviceId: string,
  onChange: (alerts: RemoteAlertEvent[]) => void,
  onError: (error: Error) => void,
  historyLimit = ALERT_HISTORY_LIMIT,
): Unsubscribe {
  const db = getFirebaseDb();

  if (!db) {
    onChange([]);
    return () => undefined;
  }

  return subscribeAfterAuth(
    () =>
      onSnapshot(
        query(
          collection(db, "devices", deviceId, "alerts"),
          orderBy("detectedAt", "desc"),
          limit(historyLimit),
        ),
        (snapshot) => {
          onChange(
            snapshot.docs.map((document) => {
              const data = document.data() as RemoteAlertEvent;

              return {
                ...data,
                id: document.id,
              };
            }),
          );
        },
        onError,
      ),
    onError,
  );
}

export function subscribeFullAlertHistory(
  deviceId: string,
  onChange: (alerts: RemoteAlertEvent[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return subscribeAlertHistory(
    deviceId,
    onChange,
    onError,
    ALERT_HISTORY_PAGE_LIMIT,
  );
}

function subscribeAfterAuth(
  subscribe: () => Unsubscribe,
  onError: (error: Error) => void,
): Unsubscribe {
  let unsubscribe: Unsubscribe | null = null;
  let active = true;

  void ensureFirebaseAuth()
    .then((user) => {
      if (!active || !user) {
        return;
      }

      unsubscribe = subscribe();
    })
    .catch((error: unknown) => {
      onError(new Error(getFirebaseAuthErrorMessage(error)));
    });

  return () => {
    active = false;
    unsubscribe?.();
  };
}

function removeUndefinedValues<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(removeUndefinedValues) as T;
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([entryKey, entryValue]) => [
        entryKey,
        removeUndefinedValues(entryValue),
      ]);

    return Object.fromEntries(entries) as T;
  }

  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}
