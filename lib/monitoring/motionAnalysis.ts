import type { Vector3 } from "@/lib/ble/sensorTypes";

export type MotionSeverity = "normal" | "attention" | "critical";

export type MotionSample = {
  timestamp: number;
  acceleration?: Vector3;
  gyroscope?: Vector3;
  euler?: Vector3;
};

export type MotionAlert = {
  id: string;
  title: string;
  message: string;
  severity: Exclude<MotionSeverity, "normal">;
  detectedAt: number;
};

export type MotionAnalysis = {
  severity: MotionSeverity;
  alerts: MotionAlert[];
  metrics: {
    accelerationMagnitudeG?: number;
    peakAccelerationMagnitudeG?: number;
    recentPeakAccelerationMagnitudeG?: number;
    angularVelocityMagnitudeDps?: number;
    peakAngularVelocityMagnitudeDps?: number;
    maxTiltDegrees?: number;
    peakTiltDegrees?: number;
    sustainedTilt: boolean;
    relativeInactivity: boolean;
    sampleCount: number;
  };
};

export type MotionAnalysisConfig = {
  impactAccelerationG: number;
  impactMemoryWindowMs: number;
  sustainedTiltDegrees: number;
  sustainedTiltWindowMs: number;
  inactivityAccelerationDeltaG: number;
  inactivityAngularVelocityDps: number;
  inactivityWindowMs: number;
};

export const defaultMotionAnalysisConfig: MotionAnalysisConfig = {
  impactAccelerationG: 1.25,
  impactMemoryWindowMs: 6000,
  sustainedTiltDegrees: 70,
  sustainedTiltWindowMs: 2500,
  inactivityAccelerationDeltaG: 0.035,
  inactivityAngularVelocityDps: 2,
  inactivityWindowMs: 8000,
};

export function analyzeMotion(
  samples: MotionSample[],
  config = defaultMotionAnalysisConfig,
): MotionAnalysis {
  const latestSample = samples.at(-1);
  const alerts: MotionAlert[] = [];
  const accelerationMagnitudeG = latestSample?.acceleration
    ? magnitude(latestSample.acceleration)
    : undefined;
  const peakAccelerationMagnitudeG = maxDefined(
    samples.map((sample) =>
      sample.acceleration ? magnitude(sample.acceleration) : undefined,
    ),
  );
  const recentSamples = latestSample
    ? samples.filter(
        (sample) =>
          sample.timestamp >=
          latestSample.timestamp - config.impactMemoryWindowMs,
      )
    : [];
  const recentPeakAccelerationMagnitudeG = maxDefined(
    recentSamples.map((sample) =>
      sample.acceleration ? magnitude(sample.acceleration) : undefined,
    ),
  );
  const angularVelocityMagnitudeDps = latestSample?.gyroscope
    ? magnitude(latestSample.gyroscope)
    : undefined;
  const peakAngularVelocityMagnitudeDps = maxDefined(
    samples.map((sample) =>
      sample.gyroscope ? magnitude(sample.gyroscope) : undefined,
    ),
  );
  const maxTiltDegrees = latestSample?.euler
    ? Math.max(Math.abs(latestSample.euler.x), Math.abs(latestSample.euler.z))
    : undefined;
  const peakTiltDegrees = maxDefined(
    samples.map((sample) =>
      sample.euler
        ? Math.max(Math.abs(sample.euler.x), Math.abs(sample.euler.z))
        : undefined,
    ),
  );
  const sustainedTilt = hasSustainedTilt(samples, config);
  const relativeInactivity = hasRelativeInactivity(samples, config);
  const hasRecentImpact =
    recentPeakAccelerationMagnitudeG !== undefined &&
    recentPeakAccelerationMagnitudeG >= config.impactAccelerationG;

  if (hasRecentImpact && (sustainedTilt || relativeInactivity)) {
    const context = sustainedTilt
      ? "postura inclinada sustentada"
      : "baixa mobilidade apos o impacto";

    alerts.push({
      id: "possible-fall",
      title: "Possivel queda",
      message: `Pico recente de ${recentPeakAccelerationMagnitudeG.toFixed(2)} g com ${context}.`,
      severity: "critical",
      detectedAt: latestSample?.timestamp ?? Date.now(),
    });
  }

  if (hasRecentImpact && !sustainedTilt && !relativeInactivity) {
    alerts.push({
      id: "impact",
      title: "Movimento brusco",
      message: `Pico recente de aceleracao total em ${recentPeakAccelerationMagnitudeG.toFixed(2)} g. Limite atual: ${config.impactAccelerationG.toFixed(2)} g.`,
      severity: "attention",
      detectedAt: latestSample?.timestamp ?? Date.now(),
    });
  }

  if (!hasRecentImpact && relativeInactivity) {
    alerts.push({
      id: "relative-inactivity",
      title: "Imobilidade relativa",
      message: `Pouca variacao de movimento por mais de ${(config.inactivityWindowMs / 1000).toFixed(1)} s.`,
      severity: "attention",
      detectedAt: latestSample?.timestamp ?? Date.now(),
    });
  }

  return {
    severity: getHighestSeverity(alerts),
    alerts,
    metrics: {
      accelerationMagnitudeG,
      peakAccelerationMagnitudeG,
      recentPeakAccelerationMagnitudeG,
      angularVelocityMagnitudeDps,
      peakAngularVelocityMagnitudeDps,
      maxTiltDegrees,
      peakTiltDegrees,
      sustainedTilt,
      relativeInactivity,
      sampleCount: samples.length,
    },
  };
}

function hasSustainedTilt(
  samples: MotionSample[],
  config: MotionAnalysisConfig,
): boolean {
  const latestSample = samples.at(-1);

  if (!latestSample) {
    return false;
  }

  const windowStart = latestSample.timestamp - config.sustainedTiltWindowMs;
  const windowSamples = samples.filter(
    (sample) => sample.timestamp >= windowStart && sample.euler,
  );

  if (windowSamples.length < 2) {
    return false;
  }

  const firstSample = windowSamples[0];
  const duration = latestSample.timestamp - firstSample.timestamp;

  return (
    duration >= config.sustainedTiltWindowMs &&
    windowSamples.every((sample) => {
      if (!sample.euler) {
        return false;
      }

      return (
        Math.abs(sample.euler.x) >= config.sustainedTiltDegrees ||
        Math.abs(sample.euler.z) >= config.sustainedTiltDegrees
      );
    })
  );
}

function hasRelativeInactivity(
  samples: MotionSample[],
  config: MotionAnalysisConfig,
): boolean {
  const latestSample = samples.at(-1);

  if (!latestSample) {
    return false;
  }

  const windowStart = latestSample.timestamp - config.inactivityWindowMs;
  const windowSamples = samples.filter(
    (sample) =>
      sample.timestamp >= windowStart && sample.acceleration && sample.gyroscope,
  );

  if (windowSamples.length < 3) {
    return false;
  }

  const firstSample = windowSamples[0];
  const duration = latestSample.timestamp - firstSample.timestamp;

  if (duration < config.inactivityWindowMs) {
    return false;
  }

  const accelerationMagnitudes = windowSamples.map((sample) =>
    magnitude(sample.acceleration as Vector3),
  );
  const angularMagnitudes = windowSamples.map((sample) =>
    magnitude(sample.gyroscope as Vector3),
  );

  return (
    Math.max(...accelerationMagnitudes) - Math.min(...accelerationMagnitudes) <=
      config.inactivityAccelerationDeltaG &&
    Math.max(...angularMagnitudes) <= config.inactivityAngularVelocityDps
  );
}

function getHighestSeverity(alerts: MotionAlert[]): MotionSeverity {
  if (alerts.some((alert) => alert.severity === "critical")) {
    return "critical";
  }

  if (alerts.length > 0) {
    return "attention";
  }

  return "normal";
}

function magnitude(vector: Vector3): number {
  return Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
}

function maxDefined(values: (number | undefined)[]): number | undefined {
  const definedValues = values.filter((value) => value !== undefined);

  if (definedValues.length === 0) {
    return undefined;
  }

  return Math.max(...definedValues);
}
