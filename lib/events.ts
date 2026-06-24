/** 같은 탭에서 경기 목록이 바뀔 때 */
export const MATCHES_UPDATED_EVENT = "pick-ranking:matches-updated";

/** 예측이 저장될 때 */
export const PREDICTIONS_UPDATED_EVENT = "pick-ranking:predictions-updated";

/** 경기 결과가 저장될 때 */
export const RESULTS_UPDATED_EVENT = "pick-ranking:results-updated";

/** 닉네임 로그인 상태 변경 */
export const NICKNAME_CHANGED_EVENT = "pick-ranking:nickname-changed";

export function emitDataEvent(name: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name));
}
