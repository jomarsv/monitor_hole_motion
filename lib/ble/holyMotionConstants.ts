export const HOLY_MOTION_PACKET_START = 0xf6;
export const HOLY_MOTION_PACKET_END = 0xf6;
export const HOLY_MOTION_HEADER_LENGTH = 4;
export const HOLY_MOTION_CHECKSUM_LENGTH = 1;
export const HOLY_MOTION_DEVICE_NAME = "HOLY-MOTION";
export const HOLY_MOTION_DEVICE_NAME_PREFIXES = ["Holy-Motion", "HOLY-MOTION"];
export const HOLY_MOTION_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
export const HOLY_MOTION_WRITE_CHARACTERISTIC_UUID =
  "6e400010-b5a3-f393-e0a9-e50e24dcca9e";
export const HOLY_MOTION_NOTIFY_CHARACTERISTIC_UUID =
  "6e400011-b5a3-f393-e0a9-e50e24dcca9e";

export const HOLY_MOTION_COMMANDS = {
  query: 0x04,
  streaming: 0x05,
  acceleration: 0x21,
  gyroscope: 0x22,
  magnetometer: 0x23,
  quaternion: 0x25,
  euler: 0x26,
} as const;

export const HOLY_MOTION_SCALES = {
  accelerationG: 16 / 32768,
  angularVelocityDps: 2000 / 32768,
  quaternion: 1 / 32768,
  eulerDegrees: 180 / 32768,
} as const;

export const HOLY_MOTION_QUERY_COMMAND = new Uint8Array([
  0xf6, 0x04, 0xf6, 0x01, 0xf1,
]);

export const HOLY_MOTION_START_COMMAND = new Uint8Array([
  0xf6, 0x05, 0xf6, 0x06, 0x01, 0x01, 0x01, 0x01, 0x01, 0xfc,
]);

export const HOLY_MOTION_STOP_COMMAND = new Uint8Array([
  0xf6, 0x05, 0xf6, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7,
]);
