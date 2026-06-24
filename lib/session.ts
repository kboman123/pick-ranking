/**
 * 클라이언트 프로필 캐시. 식별은 Supabase Auth user id, 표시는 nickname.
 */

export type UserProfile = {
  userId: string;
  nickname: string;
};

let cachedProfile: UserProfile | null = null;

export function getProfile(): UserProfile | null {
  return cachedProfile;
}

export function setProfileCache(profile: UserProfile | null): void {
  cachedProfile = profile;
}

export function clearProfileCache(): void {
  cachedProfile = null;
}
