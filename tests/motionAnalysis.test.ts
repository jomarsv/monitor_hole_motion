import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  analyzeMotion,
  defaultMotionAnalysisConfig,
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

    assert.equal(result.severity, "critical");
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

    assert.equal(result.severity, "critical");
    assert.ok(
      Math.abs((result.metrics.peakAccelerationMagnitudeG ?? 0) - Math.sqrt(1.98)) <
        0.000001,
    );
  });

  it("flags sustained tilt over the configured window", () => {
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

    assert.equal(result.severity, "attention");
    assert.equal(result.alerts[0]?.id, "sustained-tilt");
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
});
