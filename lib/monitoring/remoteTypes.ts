import type { MotionAlert, MotionSeverity } from "@/lib/monitoring/motionAnalysis";
import type { Quaternion, Vector3 } from "@/lib/ble/sensorTypes";

export type RemoteDeviceStatus = "offline" | "online";

export type RemoteSensorSnapshot = {
  acceleration?: Vector3;
  gyroscope?: Vector3;
  magnetometer?: Vector3;
  quaternion?: Quaternion;
  euler?: Vector3;
};

export type RemoteMotionMetrics = {
  accelerationMagnitudeG?: number;
  peakAccelerationMagnitudeG?: number;
  angularVelocityMagnitudeDps?: number;
  peakAngularVelocityMagnitudeDps?: number;
  maxTiltDegrees?: number;
  peakTiltDegrees?: number;
  sustainedTilt: boolean;
  relativeInactivity: boolean;
  sampleCount: number;
};

export type RemoteTelemetrySample = {
  id?: string;
  deviceId: string;
  timestamp: number;
  bleStatus: string;
  severity: MotionSeverity;
  snapshot: RemoteSensorSnapshot;
  metrics: RemoteMotionMetrics;
};

export type RemoteAlertEvent = MotionAlert & {
  id?: string;
  deviceId: string;
  acknowledged: boolean;
};

export type RemoteDeviceState = {
  deviceId: string;
  status: RemoteDeviceStatus;
  bleStatus: string;
  lastSeenAt: number;
  severity: MotionSeverity;
  snapshot: RemoteSensorSnapshot;
  metrics: RemoteMotionMetrics;
};
