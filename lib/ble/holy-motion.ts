export type HolyMotionConnectionState =
  | "unsupported"
  | "idle"
  | "scanning"
  | "connected"
  | "disconnected";

export const HOLY_MOTION_DEVICE_NAME_PREFIX = "Holy-Motion";

export function getInitialBleState(): HolyMotionConnectionState {
  return "idle";
}
