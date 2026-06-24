export const USER_ID_COOKIE = "pick-ranking-user-id";
export const USER_ID_STORAGE_KEY = "pick-ranking-user-id";

export type SessionProfile = {
  userId: string;
  kakaoId: string;
  nickname: string | null;
};

export function readUserIdFromStorage(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(USER_ID_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeUserIdToStorage(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USER_ID_STORAGE_KEY, userId);
  } catch {
    // ignore
  }
}

export function clearUserIdFromStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(USER_ID_STORAGE_KEY);
  } catch {
    // ignore
  }
}
