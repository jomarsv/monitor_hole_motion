import { AlertHistory } from "@/components/history/alert-history";

type AlertHistoryPageProps = {
  params: Promise<{
    deviceId: string;
  }>;
};

export async function generateMetadata({ params }: AlertHistoryPageProps) {
  const { deviceId } = await params;

  return {
    title: `Historico de alertas ${deviceId}`,
  };
}

export default async function AlertHistoryPage({
  params,
}: AlertHistoryPageProps) {
  const { deviceId } = await params;

  return <AlertHistory deviceId={deviceId} />;
}
