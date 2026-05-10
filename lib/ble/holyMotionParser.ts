import {
  HOLY_MOTION_CHECKSUM_LENGTH,
  HOLY_MOTION_COMMANDS,
  HOLY_MOTION_HEADER_LENGTH,
  HOLY_MOTION_SCALES,
} from "@/lib/ble/holyMotionConstants";
import { checksumOk, isHolyMotionHeaderAt } from "@/lib/ble/holyMotionProtocol";
import type {
  ParsedHolyMotionPacket,
  Quaternion,
  SplitHolyMotionPacketsResult,
  Vector3,
} from "@/lib/ble/sensorTypes";

function readInt16BE(
  bytes: Uint8Array<ArrayBufferLike>,
  offset: number,
): number {
  const value = (bytes[offset] << 8) | bytes[offset + 1];
  return value & 0x8000 ? value - 0x10000 : value;
}

function readVector3(payload: Uint8Array<ArrayBufferLike>, scale = 1): Vector3 {
  return {
    x: readInt16BE(payload, 0) * scale,
    y: readInt16BE(payload, 2) * scale,
    z: readInt16BE(payload, 4) * scale,
  };
}

function readQuaternion(payload: Uint8Array<ArrayBufferLike>): Quaternion {
  return {
    w: readInt16BE(payload, 0) * HOLY_MOTION_SCALES.quaternion,
    x: readInt16BE(payload, 2) * HOLY_MOTION_SCALES.quaternion,
    y: readInt16BE(payload, 4) * HOLY_MOTION_SCALES.quaternion,
    z: readInt16BE(payload, 6) * HOLY_MOTION_SCALES.quaternion,
  };
}

function assertPayloadLength(
  payload: Uint8Array<ArrayBufferLike>,
  expectedLength: number,
): void {
  if (payload.length !== expectedLength) {
    throw new Error(
      `Invalid Holy-Motion payload length: expected ${expectedLength}, received ${payload.length}.`,
    );
  }
}

export function parseHolyMotionPacket(
  packet: Uint8Array<ArrayBufferLike>,
): ParsedHolyMotionPacket {
  if (!checksumOk(packet)) {
    throw new Error("Invalid Holy-Motion checksum.");
  }

  if (!isHolyMotionHeaderAt(packet, 0)) {
    throw new Error("Invalid Holy-Motion packet header.");
  }

  const commandId = packet[1];
  const payloadEnd = packet.length - HOLY_MOTION_CHECKSUM_LENGTH;
  const payload = packet.slice(HOLY_MOTION_HEADER_LENGTH, payloadEnd);

  switch (commandId) {
    case HOLY_MOTION_COMMANDS.acceleration:
      assertPayloadLength(payload, 6);
      return {
        type: "acceleration",
        commandId,
        accelerationG: readVector3(payload, HOLY_MOTION_SCALES.accelerationG),
      };
    case HOLY_MOTION_COMMANDS.gyroscope:
      assertPayloadLength(payload, 6);
      return {
        type: "gyroscope",
        commandId,
        angularVelocityDps: readVector3(
          payload,
          HOLY_MOTION_SCALES.angularVelocityDps,
        ),
      };
    case HOLY_MOTION_COMMANDS.magnetometer:
      if (payload.length < 6) {
        throw new Error(
          `Invalid Holy-Motion payload length: expected at least 6, received ${payload.length}.`,
        );
      }
      return {
        type: "magnetometer",
        commandId,
        magneticFieldRaw: readVector3(payload.slice(0, 6)),
      };
    case HOLY_MOTION_COMMANDS.quaternion:
      assertPayloadLength(payload, 8);
      return {
        type: "quaternion",
        commandId,
        quaternion: readQuaternion(payload),
      };
    case HOLY_MOTION_COMMANDS.euler:
      assertPayloadLength(payload, 6);
      return {
        type: "euler",
        commandId,
        eulerDegrees: readVector3(payload, HOLY_MOTION_SCALES.eulerDegrees),
      };
    default:
      return {
        type: "unknown",
        commandId,
        payload,
      };
  }
}

export function splitPacketsFromBuffer(
  buffer: Uint8Array<ArrayBufferLike>,
): SplitHolyMotionPacketsResult {
  const packets: Uint8Array<ArrayBufferLike>[] = [];
  let cursor = 0;

  while (cursor < buffer.length) {
    if (!isHolyMotionHeaderAt(buffer, cursor)) {
      cursor += 1;
      continue;
    }

    if (cursor + HOLY_MOTION_HEADER_LENGTH > buffer.length) {
      break;
    }

    let packetLength = HOLY_MOTION_HEADER_LENGTH + buffer[cursor + 3];

    if (cursor + packetLength > buffer.length) {
      break;
    }

    let packet = buffer.slice(cursor, cursor + packetLength);
    const packetWithPadding = buffer.slice(cursor, cursor + packetLength + 1);

    if (
      !checksumOk(packet) &&
      cursor + packetLength + 1 <= buffer.length &&
      checksumOk(packetWithPadding)
    ) {
      packetLength += 1;
      packet = packetWithPadding;
    }

    packets.push(packet);
    cursor += packetLength;
  }

  return {
    packets,
    remainingBuffer: buffer.slice(cursor),
  };
}
