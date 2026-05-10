import {
  HOLY_MOTION_CHECKSUM_LENGTH,
  HOLY_MOTION_HEADER_LENGTH,
  HOLY_MOTION_PACKET_END,
  HOLY_MOTION_PACKET_START,
} from "@/lib/ble/holyMotionConstants";

function checksum(bytes: Uint8Array<ArrayBufferLike>): number {
  return bytes.reduce((sum, byte) => (sum + byte) & 0xff, 0);
}

function normalizeCommand(
  command: Uint8Array<ArrayBufferLike>,
): Uint8Array<ArrayBuffer> {
  if (command.length === 1) {
    return new Uint8Array([
      HOLY_MOTION_PACKET_START,
      command[0],
      HOLY_MOTION_PACKET_END,
    ]);
  }

  if (
    command.length === 3 &&
    command[0] === HOLY_MOTION_PACKET_START &&
    command[2] === HOLY_MOTION_PACKET_END
  ) {
    const normalized = new Uint8Array(command.length);
    normalized.set(command);
    return normalized;
  }

  throw new Error("Holy-Motion command must be one byte or F6 <command> F6.");
}

export function buildCommand(
  command: Uint8Array<ArrayBufferLike>,
  payload: Uint8Array<ArrayBufferLike> = new Uint8Array(),
): Uint8Array<ArrayBuffer> {
  const header = normalizeCommand(command);
  const length = payload.length + HOLY_MOTION_CHECKSUM_LENGTH;
  const packetWithoutChecksum = new Uint8Array(
    HOLY_MOTION_HEADER_LENGTH + payload.length,
  );

  packetWithoutChecksum.set(header, 0);
  packetWithoutChecksum[3] = length;
  packetWithoutChecksum.set(payload, HOLY_MOTION_HEADER_LENGTH);

  const packet = new Uint8Array(packetWithoutChecksum.length + 1);
  packet.set(packetWithoutChecksum, 0);
  packet[packet.length - 1] = checksum(packetWithoutChecksum);

  return packet;
}

export function checksumOk(packet: Uint8Array<ArrayBufferLike>): boolean {
  if (packet.length < HOLY_MOTION_HEADER_LENGTH + HOLY_MOTION_CHECKSUM_LENGTH) {
    return false;
  }

  const payloadAndChecksumLength = packet[3];
  const expectedPacketLength = HOLY_MOTION_HEADER_LENGTH + payloadAndChecksumLength;

  if (
    payloadAndChecksumLength < HOLY_MOTION_CHECKSUM_LENGTH ||
    packet.length < expectedPacketLength
  ) {
    return false;
  }

  const expectedChecksum = packet[packet.length - 1];
  const packetWithoutChecksum = packet.slice(0, -1);

  return checksum(packetWithoutChecksum) === expectedChecksum;
}

export function isHolyMotionHeaderAt(
  buffer: Uint8Array<ArrayBufferLike>,
  index: number,
): boolean {
  return (
    buffer[index] === HOLY_MOTION_PACKET_START &&
    index + 2 < buffer.length &&
    buffer[index + 2] === HOLY_MOTION_PACKET_END
  );
}
