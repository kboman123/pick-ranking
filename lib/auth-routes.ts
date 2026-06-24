/** 인증 없이 접근 가능한 경로 */
export const LOGIN_PATH = "/login";

/** 카카오 로그인 후 닉네임 미설정 사용자 전용 */
export const NICKNAME_PATH = "/nickname";

/** @deprecated NICKNAME_PATH 사용 */
export const SETUP_PATH = NICKNAME_PATH;

export function isPublicPath(pathname: string): boolean {
  return pathname === LOGIN_PATH || pathname.startsWith("/auth/");
}

export function isNicknamePath(pathname: string): boolean {
  return pathname === NICKNAME_PATH;
}

/** @deprecated isNicknamePath 사용 */
export function isSetupPath(pathname: string): boolean {
  return isNicknamePath(pathname);
}
