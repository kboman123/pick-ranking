"use server";

import { syncGameResults, type SyncResultSummary } from "@/lib/services/result-sync";

/** 관리자 UI / 수동 트리거용 */
export async function triggerResultSync(): Promise<SyncResultSummary> {
  return syncGameResults();
}
