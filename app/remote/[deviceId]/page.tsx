import { RemoteDeviceMonitor } from "@/components/remote/remote-device-monitor";

type RemotePageProps = {
  params: Promise<{
    deviceId: string;
  }>;
};

export async function generateMetadata({ params }: RemotePageProps) {
  const { deviceId } = await params;

  return {
    title: `Monitor remoto ${deviceId}`,
  };
}

export default async function RemotePage({ params }: RemotePageProps) {
  const { deviceId } = await params;

  return <RemoteDeviceMonitor deviceId={deviceId} />;
}
