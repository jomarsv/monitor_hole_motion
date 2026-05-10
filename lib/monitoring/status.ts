import { getInitialBleState } from "@/lib/ble/holy-motion";
import { getFirebaseClientStatus } from "@/lib/firebase/client";

type MonitoringStatusItem = {
  label: string;
  value: string;
  description: string;
};

export function getMonitoringStatus(): MonitoringStatusItem[] {
  return [
    {
      label: "BLE",
      value: getInitialBleState(),
      description: "Integração Holy-Motion ainda não implementada.",
    },
    {
      label: "Firebase",
      value: getFirebaseClientStatus(),
      description: "Cliente preparado apenas como placeholder.",
    },
    {
      label: "PWA",
      value: "estrutura inicial",
      description: "Base pronta para manifest, service worker e instalação.",
    },
  ];
}
