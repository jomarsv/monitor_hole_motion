import type { Vector3 } from "@/lib/ble/sensorTypes";
import type { RemoteBehaviorProfile } from "@/lib/monitoring/remoteTypes";

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
    restingTiltDegrees?: number;
    behaviorDeviationScore?: number;
    learnedSampleCount?: number;
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
  restingEuler?: Vector3;
  behaviorProfile?: RemoteBehaviorProfile;
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
    ? getTiltDegrees(latestSample.euler, config.restingEuler)
    : undefined;
  const peakTiltDegrees = maxDefined(
    samples.map((sample) =>
      sample.euler ? getTiltDegrees(sample.euler, config.restingEuler) : undefined,
    ),
  );
  const restingTiltDegrees = config.restingEuler
    ? getTiltDegrees(config.restingEuler)
    : undefined;
  const sustainedTilt = hasSustainedTilt(samples, config);
  const relativeInactivity = hasRelativeInactivity(samples, config);
  const hasRecentImpact =
    recentPeakAccelerationMagnitudeG !== undefined &&
    recentPeakAccelerationMagnitudeG >= config.impactAccelerationG;
  const behaviorDeviation = getBehaviorDeviation({
    accelerationMagnitudeG,
    angularVelocityMagnitudeDps,
    maxTiltDegrees,
    profile: config.behaviorProfile,
  });

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

  if (
    !hasRecentImpact &&
    !relativeInactivity &&
    behaviorDeviation.isUnusual
  ) {
    alerts.push({
      id: "unusual-motion",
      title: "Movimento fora do padrao",
      message: `Leitura atual desviou do perfil aprendido (${behaviorDeviation.reason}).`,
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
      restingTiltDegrees,
      behaviorDeviationScore: behaviorDeviation.score,
      learnedSampleCount: config.behaviorProfile?.sampleCount,
      sustainedTilt,
      relativeInactivity,
      sampleCount: samples.length,
    },
  };
}

export function updateBehaviorProfile(
  current: RemoteBehaviorProfile | undefined,
  analysis: MotionAnalysis,
  timestamp = Date.now(),
): RemoteBehaviorProfile | undefined {
  if (analysis.severity !== "normal" || analysis.metrics.sampleCount < 10) {
    return current;
  }

  const nextCount = Math.min((current?.sampleCount ?? 0) + 1, 10000);
  const learningRate = current ? Math.max(0.02, 1 / nextCount) : 1;

  return {
    sampleCount: nextCount,
    updatedAt: timestamp,
    accelerationMagnitudeMeanG: updateAverage(
      current?.accelerationMagnitudeMeanG,
      analysis.metrics.accelerationMagnitudeG,
      learningRate,
    ),
    accelerationMagnitudeTypicalPeakG: updatePeak(
      current?.accelerationMagnitudeTypicalPeakG,
      analysis.metrics.peakAccelerationMagnitudeG,
      learningRate,
    ),
    angularVelocityMeanDps: updateAverage(
      current?.angularVelocityMeanDps,
      analysis.metrics.angularVelocityMagnitudeDps,
      learningRate,
    ),
    angularVelocityTypicalPeakDps: updatePeak(
      current?.angularVelocityTypicalPeakDps,
      analysis.metrics.peakAngularVelocityMagnitudeDps,
      learningRate,
    ),
    tiltMeanDegrees: updateAverage(
      current?.tiltMeanDegrees,
      analysis.metrics.maxTiltDegrees,
      learningRate,
    ),
    tiltTypicalPeakDegrees: updatePeak(
      current?.tiltTypicalPeakDegrees,
      analysis.metrics.peakTiltDegrees,
      learningRate,
    ),
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
        getTiltDegrees(sample.euler, config.restingEuler) >=
          config.sustainedTiltDegrees
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

function getBehaviorDeviation({
  accelerationMagnitudeG,
  angularVelocityMagnitudeDps,
  maxTiltDegrees,
  profile,
}: {
  accelerationMagnitudeG?: number;
  angularVelocityMagnitudeDps?: number;
  maxTiltDegrees?: number;
  profile?: RemoteBehaviorProfile;
}) {
  if (!profile || profile.sampleCount < 20) {
    return { isUnusual: false, score: 0, reason: "perfil em aprendizado" };
  }

  const accelerationScore = getDeviationScore(
    accelerationMagnitudeG,
    profile.accelerationMagnitudeMeanG,
    profile.accelerationMagnitudeTypicalPeakG,
    0.3,
  );
  const angularScore = getDeviationScore(
    angularVelocityMagnitudeDps,
    profile.angularVelocityMeanDps,
    profile.angularVelocityTypicalPeakDps,
    12,
  );
  const tiltScore = getDeviationScore(
    maxTiltDegrees,
    profile.tiltMeanDegrees,
    profile.tiltTypicalPeakDegrees,
    18,
  );
  const score = Math.max(accelerationScore, angularScore, tiltScore);
  const reason =
    score === accelerationScore
      ? "aceleracao acima do habitual"
      : score === angularScore
        ? "giro acima do habitual"
        : "inclinacao acima do habitual";

  return {
    isUnusual: score >= 1,
    score,
    reason,
  };
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

function getTiltDegrees(euler: Vector3, restingEuler?: Vector3): number {
  if (!restingEuler) {
    return Math.max(Math.abs(euler.x), Math.abs(euler.z));
  }

  return Math.max(
    Math.abs(getAngleDeltaDegrees(euler.x, restingEuler.x)),
    Math.abs(getAngleDeltaDegrees(euler.z, restingEuler.z)),
  );
}

function getAngleDeltaDegrees(next: number, reference: number): number {
  let delta = next - reference;

  while (delta > 180) {
    delta -= 360;
  }

  while (delta < -180) {
    delta += 360;
  }

  return delta;
}

function updateAverage(
  current: number | undefined,
  next: number | undefined,
  learningRate: number,
) {
  if (next === undefined) {
    return current;
  }

  if (current === undefined) {
    return next;
  }

  return current * (1 - learningRate) + next * learningRate;
}

function updatePeak(
  current: number | undefined,
  next: number | undefined,
  learningRate: number,
) {
  if (next === undefined) {
    return current;
  }

  if (current === undefined) {
    return next;
  }

  const blended = current * (1 - learningRate) + next * learningRate;

  return Math.max(blended, next);
}

function getDeviationScore(
  value: number | undefined,
  mean: number | undefined,
  typicalPeak: number | undefined,
  margin: number,
) {
  if (value === undefined || mean === undefined) {
    return 0;
  }

  const threshold = Math.max(mean + margin, (typicalPeak ?? mean) * 1.75);

  if (threshold <= 0) {
    return 0;
  }

  return value / threshold;
}

function maxDefined(values: (number | undefined)[]): number | undefined {
  const definedValues = values.filter((value) => value !== undefined);

  if (definedValues.length === 0) {
    return undefined;
  }

  return Math.max(...definedValues);
}
