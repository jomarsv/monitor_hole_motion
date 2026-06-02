import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { UserProfile } from "@/lib/types/auth";

function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export async function consumeDailyAnalysisQuota(profile: UserProfile): Promise<{
  remaining: number;
  updatedProfile: UserProfile;
}> {
  const db = getAdminFirestore();
  const ref = db.collection("users").doc(profile.uid);
  const today = todayKey();
  const limit = profile.dailyAnalysisLimit;

  const result = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists) {
      throw new Error("Perfil de usuario nao encontrado.");
    }

    const data = snapshot.data() as UserProfile;
    const usageDate = typeof data.dailyUsageDate === "string" ? data.dailyUsageDate : null;
    const usageCount = typeof data.dailyUsageCount === "number" ? data.dailyUsageCount : 0;
    const resetCount = usageDate !== today ? 0 : usageCount;

    if (resetCount >= limit) {
      throw new Error("Limite diario de analises atingido.");
    }

    const updatedCount = resetCount + 1;

    transaction.update(ref, {
      dailyUsageDate: today,
      dailyUsageCount: updatedCount,
      updatedAt: Timestamp.now(),
      lastLoginAt: data.lastLoginAt ?? Timestamp.now()
    });

    return {
      remaining: Math.max(limit - updatedCount, 0),
      updatedProfile: {
        ...data,
        dailyUsageDate: today,
        dailyUsageCount: updatedCount
      }
    };
  });

  return result;
}
