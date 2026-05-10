import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import type {
  RemoteAlertEvent,
  RemoteDeviceState,
  RemoteTelemetrySample,
} from "@/lib/monitoring/remoteTypes";

const TELEMETRY_HISTORY_LIMIT = 120;
const ALERT_HISTORY_LIMIT = 30;

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

  const deviceRef = doc(db, "devices", alert.deviceId);
  const sanitizedAlert = removeUndefinedValues(alert);

  await addDoc(collection(deviceRef, "alerts"), {
    ...sanitizedAlert,
    serverCreatedAt: serverTimestamp(),
  });
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

  return onSnapshot(
    doc(db, "devices", deviceId),
    (snapshot) => {
      onChange(snapshot.exists() ? (snapshot.data() as RemoteDeviceState) : null);
    },
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

  return onSnapshot(
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
  );
}

export function subscribeAlertHistory(
  deviceId: string,
  onChange: (alerts: RemoteAlertEvent[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const db = getFirebaseDb();

  if (!db) {
    onChange([]);
    return () => undefined;
  }

  return onSnapshot(
    query(
      collection(db, "devices", deviceId, "alerts"),
      orderBy("detectedAt", "desc"),
      limit(ALERT_HISTORY_LIMIT),
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
  );
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
