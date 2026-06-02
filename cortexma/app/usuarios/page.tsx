import { UserAdminPanel } from "@/components/users/UserAdminPanel";
import { requirePageSession } from "@/lib/server/auth";

export default async function UsersPage() {
  await requirePageSession();
  return <UserAdminPanel />;
}
