import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  analyzeMotion,
  defaultMotionAnalysisConfig,
  updateBehaviorProfile,
  type MotionSample,
} from "@/lib/monitoring/motionAnalysis";

describe("motion analysis", () => {
  it("flags a sudden acceleration impact", () => {
    const result = analyzeMotion([
      {
        timestamp: 1000,
        acceleration: { x: 0.1, y: 0.1, z: 1.3 },
      },
    ]);

    assert.equal(result.severity, "attention");
    assert.equal(result.alerts[0]?.id, "impact");
  });

  it("keeps an impact alert when the latest sample is already lower", () => {
    const result = analyzeMotion([
      {
        timestamp: 1000,
        acceleration: { x: 0.1, y: 0.1, z: 1.4 },
      },
      {
        timestamp: 1100,
        acceleration: { x: 0.1, y: 0.1, z: 0.5 },
      },
    ]);

    assert.equal(result.severity, "attention");
    assert.ok(
      Math.abs((result.metrics.peakAccelerationMagnitudeG ?? 0) - Math.sqrt(1.98)) <
        0.000001,
    );
  });

  it("does not flag sustained tilt without a recent impact", () => {
    const samples: MotionSample[] = [
      {
        timestamp: 1000,
        euler: { x: 75, y: 0, z: 10 },
      },
      {
        timestamp: 2300,
        euler: { x: 76, y: 0, z: 9 },
      },
      {
        timestamp: 3500,
        euler: { x: 74, y: 0, z: 8 },
      },
    ];

    const result = analyzeMotion(samples);

    assert.equal(result.severity, "normal");
    assert.equal(result.alerts.length, 0);
    assert.equal(result.metrics.sustainedTilt, true);
  });

  it("does not flag a short tilt", () => {
    const result = analyzeMotion([
      {
        timestamp: 1000,
        euler: { x: 78, y: 0, z: 0 },
      },
      {
        timestamp: 1800,
        euler: { x: 79, y: 0, z: 0 },
      },
    ]);

    assert.equal(result.severity, "normal");
    assert.equal(result.alerts.length, 0);
  });

  it("flags relative inactivity over the configured window", () => {
    const samples: MotionSample[] = [
      {
        timestamp: 1200,
        acceleration: { x: 0, y: 0, z: 1 },
        gyroscope: { x: 0.2, y: 0.1, z: 0.1 },
      },
      {
        timestamp: 5000,
        acceleration: { x: 0.01, y: 0, z: 1.01 },
        gyroscope: { x: 0.3, y: 0.1, z: 0.1 },
      },
      {
        timestamp: 9200,
        acceleration: { x: 0.01, y: 0.01, z: 1 },
        gyroscope: { x: 0.2, y: 0.1, z: 0.1 },
      },
    ];

    const result = analyzeMotion(samples, {
      ...defaultMotionAnalysisConfig,
      inactivityWindowMs: 8000,
    });

    assert.equal(result.severity, "attention");
    assert.equal(result.alerts[0]?.id, "relative-inactivity");
  });

  it("flags possible fall when impact is followed by sustained tilt", () => {
    const samples: MotionSample[] = [
      {
        timestamp: 1000,
        acceleration: { x: 0, y: 0, z: 1.4 },
        euler: { x: 10, y: 0, z: 0 },
      },
      {
        timestamp: 2500,
        acceleration: { x: 0, y: 0, z: 0.5 },
        euler: { x: 76, y: 0, z: 0 },
      },
      {
        timestamp: 3600,
        acceleration: { x: 0, y: 0, z: 0.5 },
        euler: { x: 75, y: 0, z: 0 },
      },
      {
        timestamp: 5000,
        acceleration: { x: 0, y: 0, z: 0.5 },
        euler: { x: 74, y: 0, z: 0 },
      },
    ];

    const result = analyzeMotion(samples);

    assert.equal(result.severity, "critical");
    assert.equal(result.alerts[0]?.id, "possible-fall");
  });

  it("uses a calibrated resting position as the tilt reference", () => {
    const samples: MotionSample[] = [
      {
        timestamp: 1000,
        acceleration: { x: 0, y: 0, z: 1.4 },
        euler: { x: 75, y: 0, z: 5 },
      },
      {
        timestamp: 2500,
        acceleration: { x: 0, y: 0, z: 0.5 },
        euler: { x: 76, y: 0, z: 4 },
      },
      {
        timestamp: 3600,
        acceleration: { x: 0, y: 0, z: 0.5 },
        euler: { x: 75, y: 0, z: 5 },
      },
      {
        timestamp: 5000,
        acceleration: { x: 0, y: 0, z: 0.5 },
        euler: { x: 74, y: 0, z: 6 },
      },
    ];

    const result = analyzeMotion(samples, {
      ...defaultMotionAnalysisConfig,
      restingEuler: { x: 75, y: 0, z: 5 },
    });

    assert.equal(result.metrics.sustainedTilt, false);
    assert.equal(result.severity, "attention");
    assert.equal(result.alerts[0]?.id, "impact");
  });

  it("learns a behavior profile only from normal analysis windows", () => {
    const normal = analyzeMotion(
      Array.from({ length: 10 }, (_, index) => ({
        timestamp: 1000 + index * 100,
        acceleration: { x: 0, y: 0, z: 1 },
        gyroscope: { x: 0.2, y: 0.1, z: 0.1 },
        euler: { x: 4, y: 0, z: 3 },
      })),
    );

    const learned = updateBehaviorProfile(undefined, normal, 2000);

    assert.equal(learned?.sampleCount, 1);
    assert.equal(learned?.updatedAt, 2000);

    const impact = analyzeMotion([
      {
        timestamp: 3000,
        acceleration: { x: 0, y: 0, z: 1.4 },
      },
    ]);

    assert.equal(updateBehaviorProfile(learned, impact, 4000), learned);
  });

  it("flags movement that deviates from the learned behavior profile", () => {
    const result = analyzeMotion(
      [
        {
          timestamp: 1000,
          acceleration: { x: 0, y: 0, z: 1.05 },
          gyroscope: { x: 0.2, y: 0.1, z: 45 },
          euler: { x: 4, y: 0, z: 3 },
        },
      ],
      {
        ...defaultMotionAnalysisConfig,
        behaviorProfile: {
          sampleCount: 20,
          updatedAt: 900,
          accelerationMagnitudeMeanG: 1,
          accelerationMagnitudeTypicalPeakG: 1.1,
          angularVelocityMeanDps: 1,
          angularVelocityTypicalPeakDps: 5,
          tiltMeanDegrees: 4,
          tiltTypicalPeakDegrees: 8,
        },
      },
    );

    assert.equal(result.severity, "attention");
    assert.equal(result.alerts[0]?.id, "unusual-motion");
  });
});
