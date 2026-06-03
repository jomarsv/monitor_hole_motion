import { AccountSecurityPanel } from "@/components/auth/AccountSecurityPanel";
import { requirePageSession } from "@/lib/server/auth";

export default async function SettingsPage() {
  await requirePageSession();

  return <AccountSecurityPanel />;
}

