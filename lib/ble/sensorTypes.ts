export type HolyMotionPacketType =
  | "acceleration"
  | "gyroscope"
  | "magnetometer"
  | "quaternion"
  | "euler";

export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type Quaternion = {
  w: number;
  x: number;
  y: number;
  z: number;
};

export type AccelerationPacket = {
  type: "acceleration";
  commandId: number;
  accelerationG: Vector3;
};

export type GyroscopePacket = {
  type: "gyroscope";
  commandId: number;
  angularVelocityDps: Vector3;
};

export type MagnetometerPacket = {
  type: "magnetometer";
  commandId: number;
  magneticFieldRaw: Vector3;
};

export type QuaternionPacket = {
  type: "quaternion";
  commandId: number;
  quaternion: Quaternion;
};

export type EulerPacket = {
  type: "euler";
  commandId: number;
  eulerDegrees: Vector3;
};

export type UnknownHolyMotionPacket = {
  type: "unknown";
  commandId: number;
  payload: Uint8Array<ArrayBufferLike>;
};

export type ParsedHolyMotionPacket =
  | AccelerationPacket
  | GyroscopePacket
  | MagnetometerPacket
  | QuaternionPacket
  | EulerPacket
  | UnknownHolyMotionPacket;

export type SplitHolyMotionPacketsResult = {
  packets: Uint8Array<ArrayBufferLike>[];
  remainingBuffer: Uint8Array<ArrayBufferLike>;
};
