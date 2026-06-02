import { LibraryManager } from "@/components/library/LibraryManager";
import { requirePageSession } from "@/lib/server/auth";

export default async function LibraryPage() {
  await requirePageSession();
  return <LibraryManager />;
}
