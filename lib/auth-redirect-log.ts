type RedirectLogPayload = Record<string, unknown>;

/** 무한 리다이렉트 디버깅용 — 브라우저/서버 콘솔에 출력 */
export function logAuthRedirect(
  reason: string,
  target: string,
  payload?: RedirectLogPayload,
): void {
  const entry = {
    tag: "[auth-redirect]",
    reason,
    target,
    at: new Date().toISOString(),
    ...payload,
  };

  if (typeof window !== "undefined") {
    console.info(entry.tag, entry);
    return;
  }

  console.info(JSON.stringify(entry));
}
