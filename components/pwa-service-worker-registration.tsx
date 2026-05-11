"use client";

import { useEffect } from "react";
import { registerPwaServiceWorker } from "@/lib/monitoring/browserAlerts";

export function PwaServiceWorkerRegistration() {
  useEffect(() => {
    void registerPwaServiceWorker();
  }, []);

  return null;
}
