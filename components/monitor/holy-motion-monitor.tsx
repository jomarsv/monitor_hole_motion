"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HolyMotionClient,
  type HolyMotionClientStatus,
  type HolyMotionFrame,
} from "@/lib/ble/holyMotionClient";
import {
  analyzeMotion,
  defaultMotionAnalysisConfig,
  updateBehaviorProfile,
  type MotionAnalysis,
  type MotionAlert,
  type MotionSample,
} from "@/lib/monitoring/motionAnalysis";
import {
  cleanupOldTelemetry,
  isTelemetryRemoteConfigured,
  publishAlertEvent,
  publishTelemetrySample,
  saveDeviceSettings,
  subscribeDeviceSettings,
} from "@/lib/monitoring/telemetryRepository";
import { getFirebaseAuthErrorMessage } from "@/lib/firebase/client";
import {
  notifyBrowserAlert,
  stopVibration,
} from "@/lib/monitoring/browserAlerts";
import type { ParsedHolyMotionPacket, Quaternion, Vector3 } from "@/lib/ble/sensorTypes";
import type {
  AiActivityLabel,
  AiAlertDecision,
  AiAlertDecisionInput,
  AiPostureLabel,
  WindowStats,
} from "@/lib/ai/alertDecisionTypes";
import type {
  RemoteAiClassification,
  RemoteBehaviorProfile,
} from "@/lib/monitoring/remoteTypes";

type AccelerationSample = Vector3 & {
  timestamp: number;
};

type EulerSample = Vector3 & {
  timestamp: number;
};

type SensorSnapshot = {
  acceleration?: Vector3;
  gyroscope?: Vector3;
  magnetometer?: Vector3;
  quaternion?: Quaternion;
  euler?: Vector3;
};

type SensorPeaks = SensorSnapshot;

const MAX_SAMPLES = 500;
const DEFAULT_DEVICE_ID =
  process.env.NEXT_PUBLIC_REMOTE_DEVICE_ID ?? "holy-motion-001";
const TELEMETRY_PUBLISH_INTERVAL_MS = 1000;
const TELEMETRY_CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000;
const BEHAVIOR_PROFILE_SAVE_INTERVAL_MS = 15000;
const AI_ALERT_DECISION_INTERVAL_MS = 30000;
const AI_ALERT_EXPIRATION_MS = 60000;

const statusLabels: Record<HolyMotionClientStatus, string> = {
  idle: "Aguardando",
  unsupported: "Web Bluetooth indisponivel",
  "requesting-device": "Selecionando sensor",
  connecting: "Conectando",
  "discovering-services": "Localizando servicos",
  "notifications-starting": "Ativando notificacoes",
  "starting-stream": "Iniciando leitura",
  connected: "Conectado",
  stopping: "Parando leitura",
  disconnected: "Desconectado",
  error: "Erro",
};

export function HolyMotionMonitor() {
  const clientRef = useRef<HolyMotionClient | null>(null);
  const lastPublishAtRef = useRef(0);
  const lastBehaviorProfileSaveAtRef = useRef(0);
  const lastAiDecisionAtRef = useRef(0);
  const publishedAlertKeysRef = useRef<Set<string>>(new Set());
  const vibratedAlertKeysRef = useRef<Set<string>>(new Set());
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [status, setStatus] = useState<HolyMotionClientStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remoteMessage, setRemoteMessage] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiAlert, setAiAlert] = useState<MotionAlert | null>(null);
  const [aiClassification, setAiClassification] =
    useState<RemoteAiClassification | null>(null);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<SensorSnapshot>({});
  const [restingEuler, setRestingEuler] = useState<Vector3 | undefined>();
  const [behaviorProfile, setBehaviorProfile] = useState<
    RemoteBehaviorProfile | undefined
  >();
  const [peaks, setPeaks] = useState<SensorPeaks>({});
  const [accelerationSamples, setAccelerationSamples] = useState<
    AccelerationSample[]
  >([]);
  const [eulerSamples, setEulerSamples] = useState<EulerSample[]>([]);
  const [motionSamples, setMotionSamples] = useState<MotionSample[]>([]);

  useEffect(() => {
    const supported = HolyMotionClient.isSupported();
    setIsSupported(supported);

    if (!supported) {
      setStatus("unsupported");
      setErrorMessage(
        "Web Bluetooth nao esta disponivel neste navegador. Use Chrome ou Edge em uma origem segura.",
      );
    }

    return () => {
      void clientRef.current?.disconnect();
      clientRef.current = null;
    };
  }, []);

  const appendAccelerationSample = useCallback((value: Vector3) => {
    setAccelerationSamples((current) =>
      [...current, { ...value, timestamp: Date.now() }].slice(-MAX_SAMPLES),
    );
  }, []);

  const appendEulerSample = useCallback((value: Vector3) => {
    setEulerSamples((current) =>
      [...current, { ...value, timestamp: Date.now() }].slice(-MAX_SAMPLES),
    );
  }, []);

  const handleFrame = useCallback(
    (frame: HolyMotionFrame) => {
      setSnapshot((current) => updateSnapshot(current, frame.parsed));
      setPeaks((current) => updatePeaks(current, frame.parsed));
      setMotionSamples((current) =>
        appendMotionFrame(current, frame).slice(-MAX_SAMPLES),
      );

      if (frame.parsed.type === "acceleration") {
        appendAccelerationSample(frame.parsed.accelerationG);
      }

      if (frame.parsed.type === "euler") {
        appendEulerSample(frame.parsed.eulerDegrees);
      }
    },
    [appendAccelerationSample, appendEulerSample],
  );

  const motionAnalysis = useMemo(
    () =>
      analyzeMotion(motionSamples, {
        ...defaultMotionAnalysisConfig,
        restingEuler,
        behaviorProfile,
      }),
    [behaviorProfile, motionSamples, restingEuler],
  );
  const combinedAnalysis = useMemo(
    () => mergeAiAlert(motionAnalysis, aiAlert),
    [aiAlert, motionAnalysis],
  );
  const remoteConfigured = isTelemetryRemoteConfigured();

  useEffect(() => {
    if (!remoteConfigured) {
      setSettingsMessage("Calibracao salva apenas nesta sessao.");
      return;
    }

    return subscribeDeviceSettings(
      DEFAULT_DEVICE_ID,
      (settings) => {
        setRestingEuler(settings?.restingEuler);
        setBehaviorProfile(settings?.behaviorProfile);
        setSettingsMessage(
          settings?.restingEuler || settings?.behaviorProfile
            ? `Configuracao carregada: ${formatClock(settings.updatedAt ?? Date.now())}`
            : "Sem calibracao salva para este dispositivo.",
        );
      },
      (error) => {
        setSettingsMessage(`Falha ao carregar configuracao: ${error.message}`);
      },
    );
  }, [remoteConfigured]);

  useEffect(() => {
    if (combinedAnalysis.metrics.sampleCount < 10) {
      return;
    }

    const now = Date.now();

    if (
      now - lastBehaviorProfileSaveAtRef.current <
      BEHAVIOR_PROFILE_SAVE_INTERVAL_MS
    ) {
      return;
    }

    const nextProfile = updateBehaviorProfile(
      behaviorProfile,
      combinedAnalysis,
      now,
    );

    if (nextProfile === behaviorProfile) {
      return;
    }

    lastBehaviorProfileSaveAtRef.current = now;
    setBehaviorProfile(nextProfile);

    if (!remoteConfigured || !nextProfile) {
      return;
    }

    void saveDeviceSettings(DEFAULT_DEVICE_ID, {
      behaviorProfile: nextProfile,
      updatedAt: now,
    }).catch((error: unknown) => {
      setSettingsMessage(
        `Falha ao salvar perfil aprendido: ${getFirebaseAuthErrorMessage(error)}`,
      );
    });
  }, [behaviorProfile, combinedAnalysis, remoteConfigured]);

  useEffect(() => {
    if (motionSamples.length < 20) {
      return;
    }

    const now = Date.now();

    if (now - lastAiDecisionAtRef.current < AI_ALERT_DECISION_INTERVAL_MS) {
      return;
    }

    lastAiDecisionAtRef.current = now;

    const input = buildAiAlertDecisionInput({
      deviceId: DEFAULT_DEVICE_ID,
      samples: motionSamples,
      analysis: motionAnalysis,
      behaviorProfile,
      timestamp: now,
    });

    void requestAiAlertDecision(input)
      .then((decision) => {
        if (!decision.configured) {
          setAiAlert(null);
          setAiClassification(null);
          setAiMessage("IA: configure OPENAI_API_KEY no servidor para ativar.");
          return;
        }

        setAiClassification({
          posture: decision.posture,
          activity: decision.activity,
          confidence: decision.confidence,
          rationale: decision.rationale,
          updatedAt: now,
        });
        setAiMessage(
          `IA: ${formatPostureLabel(decision.posture)}, ${formatActivityLabel(decision.activity)} (${Math.round(decision.confidence * 100)}%). ${decision.shouldAlert ? "Alerta sugerido." : "Sem alerta."} ${decision.rationale}`,
        );

        if (!decision.shouldAlert || decision.confidence < 0.55) {
          setAiAlert(null);
          return;
        }

        setAiAlert({
          id: "ai-alert",
          title: decision.title || "Analise IA",
          message: decision.message,
          severity: decision.severity === "critical" ? "critical" : "attention",
          detectedAt: now,
        });
      })
      .catch((error: unknown) => {
        setAiMessage(
          `IA indisponivel: ${error instanceof Error ? error.message : String(error)}`,
        );
        setAiClassification(null);
      });
  }, [behaviorProfile, motionAnalysis, motionSamples]);

  useEffect(() => {
    if (!aiAlert) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAiAlert(null);
    }, AI_ALERT_EXPIRATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [aiAlert]);

  useEffect(() => {
    if (!remoteConfigured) {
      return;
    }

    let active = true;

    async function runCleanup() {
      try {
        const deletedCount = await cleanupOldTelemetry(DEFAULT_DEVICE_ID);

        if (!active) {
          return;
        }

        setCleanupMessage(
          deletedCount > 0
            ? `Limpeza automatica: ${deletedCount} amostras antigas removidas.`
            : `Limpeza automatica: nada antigo para remover (${formatClock(Date.now())}).`,
        );
      } catch (error: unknown) {
        if (!active) {
          return;
        }

        setCleanupMessage(
          `Falha na limpeza automatica: ${getFirebaseAuthErrorMessage(error)}`,
        );
      }
    }

    void runCleanup();
    const intervalId = window.setInterval(
      () => void runCleanup(),
      TELEMETRY_CLEANUP_INTERVAL_MS,
    );

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [remoteConfigured]);

  useEffect(() => {
    if (!remoteConfigured || motionSamples.length === 0) {
      return;
    }

    const now = Date.now();

    if (now - lastPublishAtRef.current < TELEMETRY_PUBLISH_INTERVAL_MS) {
      return;
    }

    lastPublishAtRef.current = now;

    void publishTelemetrySample({
      deviceId: DEFAULT_DEVICE_ID,
      timestamp: now,
      bleStatus: status,
      severity: combinedAnalysis.severity,
      snapshot,
      metrics: combinedAnalysis.metrics,
      aiClassification: aiClassification ?? undefined,
    })
      .then(() => {
        setRemoteMessage(`Ultimo envio remoto: ${formatClock(now)}`);
      })
      .catch((error: unknown) => {
        const message = getFirebaseAuthErrorMessage(error);
        setRemoteMessage(`Falha no envio remoto: ${message}`);
        setErrorMessage(message);
      });
  }, [
    aiClassification,
    combinedAnalysis,
    motionSamples.length,
    remoteConfigured,
    snapshot,
    status,
  ]);

  useEffect(() => {
    if (!remoteConfigured || combinedAnalysis.alerts.length === 0) {
      if (combinedAnalysis.alerts.length === 0) {
        publishedAlertKeysRef.current.clear();
      }

      return;
    }

    for (const alert of combinedAnalysis.alerts) {
      const alertKey = alert.id;

      if (publishedAlertKeysRef.current.has(alertKey)) {
        continue;
      }

      publishedAlertKeysRef.current.add(alertKey);

      void publishAlertEvent({
        ...alert,
        deviceId: DEFAULT_DEVICE_ID,
        acknowledged: false,
      }).catch((error: unknown) => {
        setErrorMessage(getFirebaseAuthErrorMessage(error));
      });
    }
  }, [combinedAnalysis.alerts, remoteConfigured]);

  useEffect(() => {
    if (combinedAnalysis.alerts.length === 0) {
      vibratedAlertKeysRef.current.clear();
      stopVibration();
      return;
    }

    for (const alert of combinedAnalysis.alerts) {
      if (vibratedAlertKeysRef.current.has(alert.id)) {
        continue;
      }

      vibratedAlertKeysRef.current.add(alert.id);
      notifyBrowserAlert({
        title: alert.title,
        body: alert.message,
        severity: alert.severity,
      });
    }
  }, [combinedAnalysis.alerts]);

  const connectSensor = useCallback(async () => {
    setErrorMessage(null);

    const client = new HolyMotionClient({
      onStatus: setStatus,
      onError: (error) => {
        setErrorMessage(error.message);
        setStatus("error");
      },
      onFrame: handleFrame,
    });

    clientRef.current = client;

    try {
      await client.connect();
    } catch {
      clientRef.current = null;
    }
  }, [handleFrame]);

  const disconnectSensor = useCallback(async () => {
    await clientRef.current?.disconnect();
    clientRef.current = null;
  }, []);

  const calibrateRestingPosition = useCallback(() => {
    if (!snapshot.euler) {
      setErrorMessage("Aguarde uma leitura de Euler antes de calibrar repouso.");
      return;
    }

    const nextRestingEuler = snapshot.euler;
    const updatedAt = Date.now();

    setRestingEuler(snapshot.euler);
    setErrorMessage(null);

    if (!remoteConfigured) {
      setSettingsMessage("Calibracao salva apenas nesta sessao.");
      return;
    }

    setSettingsMessage("Salvando calibracao do dispositivo...");

    void saveDeviceSettings(DEFAULT_DEVICE_ID, {
      restingEuler: nextRestingEuler,
      updatedAt,
    })
      .then(() => {
        setSettingsMessage(`Calibracao salva: ${formatClock(updatedAt)}`);
      })
      .catch((error: unknown) => {
        const message = getFirebaseAuthErrorMessage(error);
        setSettingsMessage(`Falha ao salvar calibracao: ${message}`);
        setErrorMessage(message);
      });
  }, [remoteConfigured, snapshot.euler]);

  const clearRestingCalibration = useCallback(() => {
    const updatedAt = Date.now();

    setRestingEuler(undefined);

    if (!remoteConfigured) {
      setSettingsMessage("Calibracao removida desta sessao.");
      return;
    }

    setSettingsMessage("Removendo calibracao do dispositivo...");

    void saveDeviceSettings(DEFAULT_DEVICE_ID, {
      clearRestingEuler: true,
      updatedAt,
    })
      .then(() => {
        setSettingsMessage(`Calibracao removida: ${formatClock(updatedAt)}`);
      })
      .catch((error: unknown) => {
        const message = getFirebaseAuthErrorMessage(error);
        setSettingsMessage(`Falha ao remover calibracao: ${message}`);
        setErrorMessage(message);
      });
  }, [remoteConfigured]);

  const canConnect =
    isSupported === true && status !== "connected" && status !== "connecting";
  const canDisconnect =
    status === "connected" ||
    status === "starting-stream" ||
    status === "notifications-starting";

  const screenClass = getAlertScreenClass(combinedAnalysis.severity);

  return (
    <main className={`min-h-screen px-4 py-6 text-[#10201d] transition-colors duration-300 sm:px-6 lg:px-8 ${screenClass}`}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-[#dce8e4] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
              Monitor BLE
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Holy-Motion
            </h1>
            <p className="mt-2 text-sm text-[#5f6f6a]">
              Gateway remoto: {DEFAULT_DEVICE_ID} · Firestore{" "}
              {remoteConfigured ? "ativo" : "nao configurado"}
            </p>
            {remoteMessage ? (
              <p className="mt-1 text-sm text-[#5f6f6a]">{remoteMessage}</p>
            ) : null}
            {cleanupMessage ? (
              <p className="mt-1 text-sm text-[#5f6f6a]">{cleanupMessage}</p>
            ) : null}
            {aiMessage ? (
              <p className="mt-1 text-sm text-[#5f6f6a]">{aiMessage}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md border border-[#c7d8d2] bg-white px-3 py-2 text-sm font-medium">
              {statusLabels[status]}
            </span>
            <button
              className="min-h-11 rounded-md border border-[#c7d8d2] bg-white px-4 py-2 text-sm font-semibold text-[#10201d] transition hover:bg-[#eef8f6] disabled:cursor-not-allowed disabled:text-[#8b9a96]"
              disabled={!snapshot.euler}
              onClick={calibrateRestingPosition}
              type="button"
            >
              Calibrar repouso
            </button>
            {restingEuler ? (
              <button
                className="min-h-11 rounded-md border border-[#c7d8d2] bg-white px-4 py-2 text-sm font-semibold text-[#10201d] transition hover:bg-[#eef8f6]"
                onClick={clearRestingCalibration}
                type="button"
              >
                Limpar calibracao
              </button>
            ) : null}
            <button
              className="min-h-11 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-[#9fb8b1]"
              disabled={!canConnect}
              onClick={connectSensor}
              type="button"
            >
              Conectar sensor
            </button>
            <button
              className="min-h-11 rounded-md border border-[#c7d8d2] bg-white px-4 py-2 text-sm font-semibold text-[#10201d] transition hover:bg-[#eef8f6] disabled:cursor-not-allowed disabled:text-[#8b9a96]"
              disabled={!canDisconnect}
              onClick={disconnectSensor}
              type="button"
            >
              Desconectar
            </button>
          </div>
        </header>

        {errorMessage ? (
          <p className="rounded-md border border-[#e6b8ad] bg-[#fff3f0] px-4 py-3 text-sm font-medium text-[#8a2d1d]">
            {errorMessage}
          </p>
        ) : null}

        <RestingCalibrationPanel
          behaviorProfile={behaviorProfile}
          restingEuler={restingEuler}
          settingsMessage={settingsMessage}
        />

        <AiClassificationPanel aiClassification={aiClassification} />

        <AttentionPanel analysis={combinedAnalysis} />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <VectorCard
            label="Aceleracao"
            peak={peaks.acceleration}
            unit="g"
            value={snapshot.acceleration}
          />
          <VectorCard
            label="Giroscopio"
            peak={peaks.gyroscope}
            unit="deg/s"
            value={snapshot.gyroscope}
          />
          <VectorCard
            label="Magnetometro"
            peak={peaks.magnetometer}
            unit="raw"
            value={snapshot.magnetometer}
          />
          <QuaternionCard peak={peaks.quaternion} value={snapshot.quaternion} />
          <VectorCard
            label="Euler"
            peak={peaks.euler}
            unit="deg"
            value={snapshot.euler}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            labels={["x", "y", "z"]}
            samples={accelerationSamples}
            title="Aceleracao em tempo real"
            unit="g"
          />
          <ChartCard
            labels={["roll", "pitch", "yaw"]}
            samples={eulerSamples}
            title="Roll, pitch e yaw"
            unit="deg"
          />
        </section>
      </div>
    </main>
  );
}

function RestingCalibrationPanel({
  behaviorProfile,
  restingEuler,
  settingsMessage,
}: {
  behaviorProfile?: RemoteBehaviorProfile;
  restingEuler?: Vector3;
  settingsMessage: string | null;
}) {
  return (
    <section className="rounded-lg border border-[#dce8e4] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5f6f6a]">
            Calibracao de repouso
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {restingEuler ? "Referencia ativa" : "Sem referencia calibrada"}
          </h2>
          {settingsMessage ? (
            <p className="mt-1 text-sm text-[#5f6f6a]">{settingsMessage}</p>
          ) : null}
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <MetricPill label="Roll" unit="deg" value={restingEuler?.x} />
          <MetricPill label="Pitch" unit="deg" value={restingEuler?.y} />
          <MetricPill label="Yaw" unit="deg" value={restingEuler?.z} />
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-4">
        <TextPill
          label="Perfil aprendido"
          value={`${behaviorProfile?.sampleCount ?? 0} ciclos`}
        />
        <MetricPill
          label="Acel. habitual"
          unit="g"
          value={behaviorProfile?.accelerationMagnitudeMeanG}
        />
        <MetricPill
          label="Giro habitual"
          unit="deg/s"
          value={behaviorProfile?.angularVelocityMeanDps}
        />
        <MetricPill
          label="Incl. habitual"
          unit="deg"
          value={behaviorProfile?.tiltMeanDegrees}
        />
      </div>
    </section>
  );
}

function AiClassificationPanel({
  aiClassification,
}: {
  aiClassification: RemoteAiClassification | null;
}) {
  return (
    <section className="rounded-lg border border-[#dce8e4] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5f6f6a]">
            Analise IA
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {aiClassification
              ? `${formatPostureLabel(aiClassification.posture)} · ${formatActivityLabel(aiClassification.activity)}`
              : "Sem classificacao recente"}
          </h2>
          <p className="mt-1 text-sm text-[#5f6f6a]">
            {aiClassification
              ? aiClassification.rationale
              : "A IA classifica postura e atividade quando a rota server-side esta ativa."}
          </p>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <TextPill
            label="Postura"
            value={
              aiClassification
                ? formatPostureLabel(aiClassification.posture)
                : "indefinido"
            }
          />
          <TextPill
            label="Atividade"
            value={
              aiClassification
                ? formatActivityLabel(aiClassification.activity)
                : "indefinido"
            }
          />
          <MetricPill
            label="Confianca"
            unit=""
            value={aiClassification?.confidence}
          />
        </div>
      </div>
    </section>
  );
}

function appendMotionFrame(
  samples: MotionSample[],
  frame: HolyMotionFrame,
): MotionSample[] {
  const latest = samples.at(-1);
  const timestamp = frame.receivedAt.getTime();
  const nextSample: MotionSample = {
    timestamp,
    acceleration: latest?.acceleration,
    gyroscope: latest?.gyroscope,
    euler: latest?.euler,
  };

  switch (frame.parsed.type) {
    case "acceleration":
      nextSample.acceleration = frame.parsed.accelerationG;
      break;
    case "gyroscope":
      nextSample.gyroscope = frame.parsed.angularVelocityDps;
      break;
    case "euler":
      nextSample.euler = frame.parsed.eulerDegrees;
      break;
    case "magnetometer":
    case "quaternion":
    case "unknown":
      return samples;
  }

  return [...samples, nextSample];
}

function mergeAiAlert(
  analysis: MotionAnalysis,
  aiAlert: MotionAlert | null,
): MotionAnalysis {
  if (!aiAlert) {
    return analysis;
  }

  const alerts = [
    ...analysis.alerts.filter((alert) => alert.id !== aiAlert.id),
    aiAlert,
  ];

  return {
    ...analysis,
    severity: alerts.some((alert) => alert.severity === "critical")
      ? "critical"
      : "attention",
    alerts,
  };
}

function buildAiAlertDecisionInput({
  deviceId,
  samples,
  analysis,
  behaviorProfile,
  timestamp,
}: {
  deviceId: string;
  samples: MotionSample[];
  analysis: MotionAnalysis;
  behaviorProfile?: RemoteBehaviorProfile;
  timestamp: number;
}): AiAlertDecisionInput {
  const recentSamples = samples.slice(-120);
  const firstSample = recentSamples[0];
  const lastSample = recentSamples.at(-1);

  return {
    deviceId,
    timestamp,
    localSeverity: analysis.severity,
    localAlertIds: analysis.alerts.map((alert) => alert.id),
    metrics: analysis.metrics,
    behaviorProfile,
    recentWindow: {
      sampleCount: recentSamples.length,
      durationMs:
        firstSample && lastSample ? lastSample.timestamp - firstSample.timestamp : 0,
      accelerationMagnitude: getWindowStats(
        recentSamples.map((sample) =>
          sample.acceleration ? vectorMagnitude(sample.acceleration) : undefined,
        ),
      ),
      angularVelocityMagnitude: getWindowStats(
        recentSamples.map((sample) =>
          sample.gyroscope ? vectorMagnitude(sample.gyroscope) : undefined,
        ),
      ),
      tiltDegrees: getWindowStats(
        recentSamples.map((sample) =>
          sample.euler
            ? Math.max(Math.abs(sample.euler.x), Math.abs(sample.euler.z))
            : undefined,
        ),
      ),
    },
  };
}

async function requestAiAlertDecision(
  input: AiAlertDecisionInput,
): Promise<AiAlertDecision> {
  const response = await fetch("/api/ai/alert-decision", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Falha HTTP ${response.status}`);
  }

  return (await response.json()) as AiAlertDecision;
}

function getWindowStats(values: (number | undefined)[]): WindowStats {
  const definedValues = values.filter((value) => value !== undefined);

  if (definedValues.length === 0) {
    return {};
  }

  return {
    min: Math.min(...definedValues),
    max: Math.max(...definedValues),
    mean:
      definedValues.reduce((total, value) => total + value, 0) /
      definedValues.length,
    latest: definedValues.at(-1),
  };
}

function vectorMagnitude(vector: Vector3): number {
  return Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
}

function AttentionPanel({ analysis }: { analysis: MotionAnalysis }) {
  const isNormal = analysis.severity === "normal";
  const panelClass =
    analysis.severity === "critical"
      ? "border-[#d64f35] bg-[#fff1ed] text-[#7a2416]"
      : analysis.severity === "attention"
        ? "border-[#d99a2b] bg-[#fff8e8] text-[#6d4710]"
        : "border-[#cfe0db] bg-white text-[#264541]";

  return (
    <section className={`rounded-lg border p-4 shadow-sm ${panelClass}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em]">
            Analise local
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {isNormal ? "Sem alerta ativo" : "Movimento requer atencao"}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6">
            {isNormal
              ? "As leituras atuais nao ultrapassam os limites iniciais de impacto, inclinacao sustentada ou imobilidade relativa."
              : "Uma ou mais regras locais foram acionadas. Use este resultado como triagem tecnica, ainda sem classificacao clinica validada."}
          </p>
        </div>
        <div className="grid min-w-72 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-1">
          <MetricPill
            label="Acel. total"
            unit="g"
            value={analysis.metrics.accelerationMagnitudeG}
          />
          <MetricPill
            label="Pico acel."
            unit="g"
            value={analysis.metrics.peakAccelerationMagnitudeG}
          />
          <MetricPill
            label="Pico recente"
            unit="g"
            value={analysis.metrics.recentPeakAccelerationMagnitudeG}
          />
          <MetricPill
            label="Giro total"
            unit="deg/s"
            value={analysis.metrics.angularVelocityMagnitudeDps}
          />
          <MetricPill
            label="Pico giro"
            unit="deg/s"
            value={analysis.metrics.peakAngularVelocityMagnitudeDps}
          />
          <MetricPill
            label="Incl. max"
            unit="deg"
            value={analysis.metrics.maxTiltDegrees}
          />
          <MetricPill
            label="Pico incl."
            unit="deg"
            value={analysis.metrics.peakTiltDegrees}
          />
          <TextPill
            label="Incl. sustentada"
            value={analysis.metrics.sustainedTilt ? "sim" : "nao"}
          />
          <TextPill
            label="Imobilidade"
            value={analysis.metrics.relativeInactivity ? "sim" : "nao"}
          />
          <MetricPill
            label="Desvio perfil"
            unit="x"
            value={analysis.metrics.behaviorDeviationScore}
          />
          <TextPill
            label="Amostras perfil"
            value={String(analysis.metrics.learnedSampleCount ?? 0)}
          />
        </div>
      </div>
      {analysis.alerts.length > 0 ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {analysis.alerts.map((alert) => (
            <article
              className="rounded-md border border-current/20 bg-white/55 p-3"
              key={alert.id}
            >
              <p className="text-sm font-semibold">{alert.title}</p>
              <p className="mt-1 text-sm leading-5">{alert.message}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function TextPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-current/15 bg-white/60 px-3 py-2">
      <p className="text-xs font-semibold">{label}</p>
      <p className="mt-1 font-mono text-sm">{value}</p>
    </div>
  );
}

function MetricPill({
  label,
  value,
  unit,
}: {
  label: string;
  value?: number;
  unit: string;
}) {
  return (
    <div className="rounded-md border border-current/15 bg-white/60 px-3 py-2">
      <p className="text-xs font-semibold">{label}</p>
      <p className="mt-1 font-mono text-sm">
        {formatNumber(value)}
        <span className="ml-1 opacity-75">{unit}</span>
      </p>
    </div>
  );
}

function updateSnapshot(
  current: SensorSnapshot,
  packet: ParsedHolyMotionPacket,
): SensorSnapshot {
  switch (packet.type) {
    case "acceleration":
      return { ...current, acceleration: packet.accelerationG };
    case "gyroscope":
      return { ...current, gyroscope: packet.angularVelocityDps };
    case "magnetometer":
      return { ...current, magnetometer: packet.magneticFieldRaw };
    case "quaternion":
      return { ...current, quaternion: packet.quaternion };
    case "euler":
      return { ...current, euler: packet.eulerDegrees };
    case "unknown":
      return current;
  }
}

function updatePeaks(current: SensorPeaks, packet: ParsedHolyMotionPacket): SensorPeaks {
  switch (packet.type) {
    case "acceleration":
      return {
        ...current,
        acceleration: maxAbsVector(current.acceleration, packet.accelerationG),
      };
    case "gyroscope":
      return {
        ...current,
        gyroscope: maxAbsVector(current.gyroscope, packet.angularVelocityDps),
      };
    case "magnetometer":
      return {
        ...current,
        magnetometer: maxAbsVector(current.magnetometer, packet.magneticFieldRaw),
      };
    case "quaternion":
      return {
        ...current,
        quaternion: maxAbsQuaternion(current.quaternion, packet.quaternion),
      };
    case "euler":
      return {
        ...current,
        euler: maxAbsVector(current.euler, packet.eulerDegrees),
      };
    case "unknown":
      return current;
  }
}

function maxAbsVector(current: Vector3 | undefined, next: Vector3): Vector3 {
  return {
    x: maxAbs(current?.x, next.x),
    y: maxAbs(current?.y, next.y),
    z: maxAbs(current?.z, next.z),
  };
}

function maxAbsQuaternion(
  current: Quaternion | undefined,
  next: Quaternion,
): Quaternion {
  return {
    w: maxAbs(current?.w, next.w),
    x: maxAbs(current?.x, next.x),
    y: maxAbs(current?.y, next.y),
    z: maxAbs(current?.z, next.z),
  };
}

function maxAbs(current: number | undefined, next: number): number {
  if (current === undefined) {
    return next;
  }

  return Math.abs(next) > Math.abs(current) ? next : current;
}

function VectorCard({
  label,
  peak,
  value,
  unit,
}: {
  label: string;
  peak?: Vector3;
  value?: Vector3;
  unit: string;
}) {
  return (
    <article className="rounded-lg border border-[#dce8e4] bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-[#5f6f6a]">{label}</p>
      <div className="mt-4 grid gap-2">
        <MetricHeader />
        <MetricRow label="X" peak={peak?.x} unit={unit} value={value?.x} />
        <MetricRow label="Y" peak={peak?.y} unit={unit} value={value?.y} />
        <MetricRow label="Z" peak={peak?.z} unit={unit} value={value?.z} />
      </div>
    </article>
  );
}

function QuaternionCard({
  peak,
  value,
}: {
  peak?: Quaternion;
  value?: Quaternion;
}) {
  return (
    <article className="rounded-lg border border-[#dce8e4] bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-[#5f6f6a]">Quaternion</p>
      <div className="mt-4 grid gap-2">
        <MetricHeader />
        <MetricRow label="W" peak={peak?.w} value={value?.w} />
        <MetricRow label="X" peak={peak?.x} value={value?.x} />
        <MetricRow label="Y" peak={peak?.y} value={value?.y} />
        <MetricRow label="Z" peak={peak?.z} value={value?.z} />
      </div>
    </article>
  );
}

function MetricHeader() {
  return (
    <div className="grid grid-cols-[24px_1fr_1fr] gap-2 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7a8a86]">
      <span />
      <span className="text-right">Atual</span>
      <span className="text-right">Max</span>
    </div>
  );
}

function MetricRow({
  label,
  peak,
  value,
  unit,
}: {
  label: string;
  peak?: number;
  value?: number;
  unit?: string;
}) {
  return (
    <div className="grid min-h-8 grid-cols-[24px_1fr_1fr] items-center gap-2 rounded-md bg-[#f7faf9] px-3 py-1.5">
      <span className="text-xs font-semibold text-[#5f6f6a]">{label}</span>
      <span className="text-right font-mono text-sm text-[#10201d]">
        {formatNumber(value)}
        {unit ? <span className="ml-1 text-[#6f7f7a]">{unit}</span> : null}
      </span>
      <span className="text-right font-mono text-sm text-[#10201d]">
        {formatNumber(peak)}
        {unit ? <span className="ml-1 text-[#6f7f7a]">{unit}</span> : null}
      </span>
    </div>
  );
}

function ChartCard<T extends Vector3>({
  title,
  unit,
  samples,
  labels,
}: {
  title: string;
  unit: string;
  samples: T[];
  labels: [string, string, string];
}) {
  const series = useMemo(
    () => [
      {
        label: labels[0],
        color: "#176b5e",
        values: samples.map((sample) => sample.x),
      },
      {
        label: labels[1],
        color: "#b2462c",
        values: samples.map((sample) => sample.y),
      },
      {
        label: labels[2],
        color: "#3e5f9d",
        values: samples.map((sample) => sample.z),
      },
    ],
    [labels, samples],
  );

  return (
    <article className="rounded-lg border border-[#dce8e4] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-[#5f6f6a]">
            {samples.length} / {MAX_SAMPLES} amostras
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {series.map((item) => (
            <span
              className="flex items-center gap-1.5 text-xs font-medium text-[#5f6f6a]"
              key={item.label}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      <LineChart series={series} unit={unit} />
    </article>
  );
}

function LineChart({
  series,
  unit,
}: {
  series: { label: string; color: string; values: number[] }[];
  unit: string;
}) {
  const width = 720;
  const height = 260;
  const padding = 28;
  const allValues = series.flatMap((item) => item.values);
  const minValue = allValues.length > 0 ? Math.min(...allValues) : -1;
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 1;
  const range = maxValue - minValue || 1;

  const paths = series.map((item) => ({
    ...item,
    path: buildPath(item.values, {
      width,
      height,
      padding,
      minValue,
      range,
    }),
  }));

  return (
    <div className="mt-4 overflow-hidden rounded-md border border-[#e4eeeb] bg-[#fbfdfc]">
      <svg
        aria-label={`Grafico ${unit}`}
        className="block h-[260px] w-full"
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <line
          stroke="#d6e3df"
          strokeDasharray="4 4"
          x1={padding}
          x2={width - padding}
          y1={height / 2}
          y2={height / 2}
        />
        {[0.25, 0.5, 0.75].map((position) => (
          <line
            key={position}
            stroke="#edf4f2"
            x1={padding}
            x2={width - padding}
            y1={height * position}
            y2={height * position}
          />
        ))}
        {paths.map((item) => (
          <path
            d={item.path}
            fill="none"
            key={item.label}
            stroke={item.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
          />
        ))}
        {allValues.length === 0 ? (
          <text
            fill="#7b8b86"
            fontSize="14"
            textAnchor="middle"
            x={width / 2}
            y={height / 2}
          >
            Aguardando dados
          </text>
        ) : null}
      </svg>
    </div>
  );
}

function buildPath(
  values: number[],
  bounds: {
    width: number;
    height: number;
    padding: number;
    minValue: number;
    range: number;
  },
) {
  if (values.length === 0) {
    return "";
  }

  const drawableWidth = bounds.width - bounds.padding * 2;
  const drawableHeight = bounds.height - bounds.padding * 2;
  const xStep = values.length > 1 ? drawableWidth / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const x = bounds.padding + index * xStep;
      const normalized = (value - bounds.minValue) / bounds.range;
      const y = bounds.padding + drawableHeight - normalized * drawableHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function formatNumber(value?: number) {
  if (value === undefined) {
    return "--";
  }

  return value.toFixed(3);
}

function formatClock(timestamp: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);
}

function formatPostureLabel(posture: AiPostureLabel) {
  switch (posture) {
    case "em-pe":
      return "Em pe";
    case "deitado":
      return "Deitado";
    case "sentado":
      return "Sentado";
    case "andando":
      return "Andando";
    case "parado":
      return "Parado";
    case "transicao":
      return "Em transicao";
    case "indefinido":
      return "Indefinido";
  }
}

function formatActivityLabel(activity: AiActivityLabel) {
  switch (activity) {
    case "repouso":
      return "Repouso";
    case "movimento-leve":
      return "Movimento leve";
    case "caminhada":
      return "Caminhada";
    case "mudanca-de-postura":
      return "Mudanca de postura";
    case "movimento-brusco":
      return "Movimento brusco";
    case "indefinido":
      return "Indefinido";
  }
}

function getAlertScreenClass(severity: MotionAnalysis["severity"]) {
  if (severity === "critical") {
    return "bg-[#fff1ed]";
  }

  if (severity === "attention") {
    return "bg-[#fff8e8]";
  }

  return "bg-[#f7faf9]";
}
