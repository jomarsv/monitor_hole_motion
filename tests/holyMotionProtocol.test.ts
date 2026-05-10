import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCommand,
  checksumOk,
} from "@/lib/ble/holyMotionProtocol";
import {
  parseHolyMotionPacket,
  splitPacketsFromBuffer,
} from "@/lib/ble/holyMotionParser";
import type { ParsedHolyMotionPacket } from "@/lib/ble/sensorTypes";

function bytes(hex: string): Uint8Array<ArrayBuffer> {
  const values = hex.split(" ").map((byte) => Number.parseInt(byte, 16));
  const output = new Uint8Array(values.length);
  output.set(values);
  return output;
}

function assertClose(actual: number, expected: number): void {
  assert.ok(
    Math.abs(actual - expected) < 0.000001,
    `expected ${actual} to be close to ${expected}`,
  );
}

function assertType<T extends ParsedHolyMotionPacket["type"]>(
  packet: ParsedHolyMotionPacket,
  type: T,
): asserts packet is Extract<ParsedHolyMotionPacket, { type: T }> {
  assert.equal(packet.type, type);
}

describe("Holy-Motion protocol", () => {
  const acceleration = bytes("F6 21 F6 07 00 0A 00 76 03 C8 5F");
  const gyroscope = bytes("F6 22 F6 07 FF FE FF FD FF FD 0A");
  const magnetometer = bytes("F6 23 F6 07 00 A8 FA DD FF 8C 00 20");
  const quaternion = bytes("F6 25 F6 09 00 3C FF D3 03 E5 FF FE 0D");
  const euler = bytes("F6 26 F6 07 B9 EB 02 B7 BB BF F0");

  it("validates checksums from real packets", () => {
    for (const packet of [
      acceleration,
      gyroscope,
      magnetometer,
      quaternion,
      euler,
    ]) {
      assert.equal(checksumOk(packet), true);
    }

    const corrupted = new Uint8Array(acceleration);
    corrupted[4] = 0xff;

    assert.equal(checksumOk(corrupted), false);
  });

  it("builds commands with Holy-Motion checksum", () => {
    assert.deepEqual(
      buildCommand(new Uint8Array([0x21]), bytes("00 0A 00 76 03 C8")),
      acceleration,
    );
  });

  it("splits complete packets and keeps incomplete remainder", () => {
    const incompleteEuler = euler.slice(0, 6);
    const buffer = new Uint8Array([
      0x99,
      ...acceleration,
      ...gyroscope,
      ...incompleteEuler,
    ]);

    const { packets, remainingBuffer } = splitPacketsFromBuffer(buffer);

    assert.deepEqual(packets, [acceleration, gyroscope]);
    assert.deepEqual(remainingBuffer, incompleteEuler);
  });

  it("decodes acceleration in g", () => {
    const packet = parseHolyMotionPacket(acceleration);
    assertType(packet, "acceleration");

    assertClose(packet.accelerationG.x, 0.0048828125);
    assertClose(packet.accelerationG.y, 0.0576171875);
    assertClose(packet.accelerationG.z, 0.47265625);
  });

  it("decodes gyroscope in degrees per second", () => {
    const packet = parseHolyMotionPacket(gyroscope);
    assertType(packet, "gyroscope");

    assertClose(packet.angularVelocityDps.x, -0.1220703125);
    assertClose(packet.angularVelocityDps.y, -0.18310546875);
    assertClose(packet.angularVelocityDps.z, -0.18310546875);
  });

  it("decodes magnetometer as raw signed axes", () => {
    const packet = parseHolyMotionPacket(magnetometer);
    assertType(packet, "magnetometer");

    assert.equal(packet.magneticFieldRaw.x, 168);
    assert.equal(packet.magneticFieldRaw.y, -1315);
    assert.equal(packet.magneticFieldRaw.z, -116);
  });

  it("decodes quaternion components", () => {
    const packet = parseHolyMotionPacket(quaternion);
    assertType(packet, "quaternion");

    assertClose(packet.quaternion.w, 0.0018310546875);
    assertClose(packet.quaternion.x, -0.001373291015625);
    assertClose(packet.quaternion.y, 0.030426025390625);
    assertClose(packet.quaternion.z, -0.00006103515625);
  });

  it("decodes euler angles in degrees", () => {
    const packet = parseHolyMotionPacket(euler);
    assertType(packet, "euler");

    assertClose(packet.eulerDegrees.x, -98.5528564453125);
    assertClose(packet.eulerDegrees.y, 3.8177490234375);
    assertClose(packet.eulerDegrees.z, -95.9820556640625);
  });
});
