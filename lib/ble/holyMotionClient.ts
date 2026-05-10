import {
  HOLY_MOTION_DEVICE_NAME,
  HOLY_MOTION_DEVICE_NAME_PREFIXES,
  HOLY_MOTION_NOTIFY_CHARACTERISTIC_UUID,
  HOLY_MOTION_QUERY_COMMAND,
  HOLY_MOTION_SERVICE_UUID,
  HOLY_MOTION_START_COMMAND,
  HOLY_MOTION_STOP_COMMAND,
  HOLY_MOTION_WRITE_CHARACTERISTIC_UUID,
} from "@/lib/ble/holyMotionConstants";
import {
  parseHolyMotionPacket,
  splitPacketsFromBuffer,
} from "@/lib/ble/holyMotionParser";
import type { ParsedHolyMotionPacket } from "@/lib/ble/sensorTypes";

export type HolyMotionClientStatus =
  | "idle"
  | "unsupported"
  | "requesting-device"
  | "connecting"
  | "discovering-services"
  | "notifications-starting"
  | "starting-stream"
  | "connected"
  | "stopping"
  | "disconnected"
  | "error";

export type HolyMotionFrame = {
  packet: Uint8Array;
  parsed: ParsedHolyMotionPacket;
  receivedAt: Date;
};

export type HolyMotionClientCallbacks = {
  onFrame?: (frame: HolyMotionFrame) => void;
  onPacket?: (packet: Uint8Array<ArrayBufferLike>) => void;
  onStatus?: (status: HolyMotionClientStatus) => void;
  onError?: (error: Error) => void;
};

export type HolyMotionClientOptions = HolyMotionClientCallbacks & {
  deviceName?: string;
  deviceNamePrefixes?: string[];
  serviceUuid?: string;
  writeCharacteristicUuid?: string;
  notifyCharacteristicUuid?: string;
};

type BluetoothServiceUUID = string | number;
type BluetoothCharacteristicUUID = string | number;

type BluetoothRequestDeviceFilter = {
  name?: string;
  namePrefix?: string;
  services?: BluetoothServiceUUID[];
};

type RequestDeviceOptions = {
  filters: BluetoothRequestDeviceFilter[];
  optionalServices?: BluetoothServiceUUID[];
};

type BluetoothRemoteGATTCharacteristic = EventTarget & {
  value?: DataView;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithoutResponse?: (value: BufferSource) => Promise<void>;
  addEventListener(
    type: "characteristicvaluechanged",
    listener: EventListenerOrEventListenerObject,
  ): void;
  removeEventListener(
    type: "characteristicvaluechanged",
    listener: EventListenerOrEventListenerObject,
  ): void;
};

type BluetoothRemoteGATTService = {
  getCharacteristic(
    characteristic: BluetoothCharacteristicUUID,
  ): Promise<BluetoothRemoteGATTCharacteristic>;
};

type BluetoothRemoteGATTServer = {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(
    service: BluetoothServiceUUID,
  ): Promise<BluetoothRemoteGATTService>;
};

type BluetoothDevice = EventTarget & {
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  addEventListener(
    type: "gattserverdisconnected",
    listener: EventListenerOrEventListenerObject,
  ): void;
  removeEventListener(
    type: "gattserverdisconnected",
    listener: EventListenerOrEventListenerObject,
  ): void;
};

type Bluetooth = {
  requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
};

type NavigatorWithBluetooth = Navigator & {
  bluetooth?: Bluetooth;
};

export class HolyMotionClient {
  private readonly deviceName: string;
  private readonly deviceNamePrefixes: string[];
  private readonly serviceUuid: string;
  private readonly writeCharacteristicUuid: string;
  private readonly notifyCharacteristicUuid: string;
  private readonly callbacks: HolyMotionClientCallbacks;
  private device?: BluetoothDevice;
  private server?: BluetoothRemoteGATTServer;
  private writeCharacteristic?: BluetoothRemoteGATTCharacteristic;
  private notifyCharacteristic?: BluetoothRemoteGATTCharacteristic;
  private receiveBuffer: Uint8Array<ArrayBufferLike> = new Uint8Array();
  private disconnecting = false;
  private status: HolyMotionClientStatus = "idle";

  constructor(options: HolyMotionClientOptions = {}) {
    this.deviceName = options.deviceName ?? HOLY_MOTION_DEVICE_NAME;
    this.deviceNamePrefixes =
      options.deviceNamePrefixes ?? HOLY_MOTION_DEVICE_NAME_PREFIXES;
    this.serviceUuid = options.serviceUuid ?? HOLY_MOTION_SERVICE_UUID;
    this.writeCharacteristicUuid =
      options.writeCharacteristicUuid ?? HOLY_MOTION_WRITE_CHARACTERISTIC_UUID;
    this.notifyCharacteristicUuid =
      options.notifyCharacteristicUuid ?? HOLY_MOTION_NOTIFY_CHARACTERISTIC_UUID;
    this.callbacks = options;
  }

  get currentStatus(): HolyMotionClientStatus {
    return this.status;
  }

  get isConnected(): boolean {
    return this.server?.connected ?? false;
  }

  static isSupported(): boolean {
    return Boolean((globalThis.navigator as NavigatorWithBluetooth | undefined)?.bluetooth);
  }

  async connect(): Promise<void> {
    const bluetooth = this.getBluetooth();

    if (!bluetooth) {
      this.setStatus("unsupported");
      throw this.reportError(new Error("Web Bluetooth is not available."));
    }

    try {
      this.disconnecting = false;
      this.setStatus("requesting-device");
      this.device = await bluetooth.requestDevice({
        filters: this.getDeviceFilters(),
        optionalServices: [this.serviceUuid],
      });
      this.device.addEventListener(
        "gattserverdisconnected",
        this.handleGattDisconnected,
      );

      if (!this.device.gatt) {
        throw new Error("Selected Holy-Motion device does not expose GATT.");
      }

      this.setStatus("connecting");
      this.server = await this.device.gatt.connect();

      this.setStatus("discovering-services");
      const service = await this.server.getPrimaryService(this.serviceUuid);
      this.writeCharacteristic = await service.getCharacteristic(
        this.writeCharacteristicUuid,
      );
      this.notifyCharacteristic = await service.getCharacteristic(
        this.notifyCharacteristicUuid,
      );

      this.setStatus("notifications-starting");
      await this.notifyCharacteristic.startNotifications();
      this.notifyCharacteristic.addEventListener(
        "characteristicvaluechanged",
        this.handleCharacteristicValueChanged,
      );

      await this.writeCommand(HOLY_MOTION_QUERY_COMMAND);

      this.setStatus("starting-stream");
      await this.writeCommand(HOLY_MOTION_START_COMMAND);

      this.setStatus("connected");
    } catch (error) {
      this.setStatus("error");
      throw this.reportError(error);
    }
  }

  async disconnect(): Promise<void> {
    this.disconnecting = true;
    this.setStatus("stopping");

    try {
      if (this.writeCharacteristic && this.server?.connected) {
        await this.writeCommand(HOLY_MOTION_STOP_COMMAND);
      }

      if (this.notifyCharacteristic) {
        this.notifyCharacteristic.removeEventListener(
          "characteristicvaluechanged",
          this.handleCharacteristicValueChanged,
        );

        if (this.server?.connected) {
          await this.notifyCharacteristic.stopNotifications();
        }
      }

      this.device?.removeEventListener(
        "gattserverdisconnected",
        this.handleGattDisconnected,
      );

      if (this.server?.connected) {
        this.server.disconnect();
      }
    } catch (error) {
      this.reportError(error);
    } finally {
      this.clearConnection();
      this.disconnecting = false;
      this.setStatus("disconnected");
    }
  }

  async sendCommand(command: Uint8Array<ArrayBufferLike>): Promise<void> {
    if (!this.writeCharacteristic || !this.server?.connected) {
      throw this.reportError(new Error("Holy-Motion device is not connected."));
    }

    await this.writeCommand(command);
  }

  private getBluetooth(): Bluetooth | undefined {
    return (globalThis.navigator as NavigatorWithBluetooth | undefined)?.bluetooth;
  }

  private getDeviceFilters(): BluetoothRequestDeviceFilter[] {
    const filters: BluetoothRequestDeviceFilter[] = [{ name: this.deviceName }];

    for (const prefix of this.deviceNamePrefixes) {
      filters.push({ namePrefix: prefix });
    }

    return filters;
  }

  private async writeCommand(command: Uint8Array<ArrayBufferLike>): Promise<void> {
    if (!this.writeCharacteristic) {
      throw new Error("Holy-Motion write characteristic is not available.");
    }

    const value = copyBytes(command);

    if (this.writeCharacteristic.writeValueWithoutResponse) {
      await this.writeCharacteristic.writeValueWithoutResponse(value);
      return;
    }

    await this.writeCharacteristic.writeValue(value);
  }

  private readonly handleCharacteristicValueChanged = (event: Event): void => {
    try {
      const characteristic = event.target as BluetoothRemoteGATTCharacteristic;

      if (!characteristic.value) {
        return;
      }

      const chunk = copyDataView(characteristic.value);
      const nextBuffer = new Uint8Array(this.receiveBuffer.length + chunk.length);
      nextBuffer.set(this.receiveBuffer, 0);
      nextBuffer.set(chunk, this.receiveBuffer.length);

      const { packets, remainingBuffer } = splitPacketsFromBuffer(nextBuffer);
      this.receiveBuffer = remainingBuffer;

      for (const packet of packets) {
        this.callbacks.onPacket?.(packet);

        const parsed = parseHolyMotionPacket(packet);
        this.callbacks.onFrame?.({
          packet,
          parsed,
          receivedAt: new Date(),
        });
      }
    } catch (error) {
      this.reportError(error);
    }
  };

  private readonly handleGattDisconnected = (): void => {
    this.clearConnection();

    if (!this.disconnecting) {
      this.setStatus("disconnected");
    }
  };

  private clearConnection(): void {
    this.server = undefined;
    this.writeCharacteristic = undefined;
    this.notifyCharacteristic = undefined;
    this.receiveBuffer = new Uint8Array();
  }

  private setStatus(status: HolyMotionClientStatus): void {
    this.status = status;
    this.callbacks.onStatus?.(status);
  }

  private reportError(error: unknown): Error {
    const normalizedError =
      error instanceof Error ? error : new Error(String(error));

    this.callbacks.onError?.(normalizedError);

    return normalizedError;
  }
}

function copyBytes(bytes: Uint8Array<ArrayBufferLike>): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy;
}

function copyDataView(value: DataView): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(value.byteLength);

  for (let index = 0; index < value.byteLength; index += 1) {
    bytes[index] = value.getUint8(index);
  }

  return bytes;
}
