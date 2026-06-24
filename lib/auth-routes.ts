/** 인증 없이 접근 가능한 경로 */
export const LOGIN_PATH = "/login";

/** 카카오 로그인 후 닉네임 미설정 사용자 전용 */
export const SETUP_PATH = "/setup";

export function isPublicPath(pathname: string): boolean {
  return pathname === LOGIN_PATH || pathname.startsWith("/auth/");
}

export function isSetupPath(pathname: string): boolean {
  return pathname === SETUP_PATH;
}
