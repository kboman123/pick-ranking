import { NextResponse } from "next/server";
import { fetchUserProfileByAuthId } from "@/app/actions/user-profile";
import { LOGIN_PATH, NICKNAME_PATH } from "@/lib/auth-routes";
import { logAuthRedirect } from "@/lib/auth-redirect-log";
import { createServerSupabaseClient } from "@/lib/supabase/server-ssr";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const supabase = await createServerSupabaseClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      logAuthRedirect("callback-exchange-error", LOGIN_PATH, {
        error: error.message,
      });
      return NextResponse.redirect(
        `${origin}${LOGIN_PATH}?auth_error=${encodeURIComponent(error.message)}`,
      );
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    logAuthRedirect("callback-no-session", LOGIN_PATH);
    return NextResponse.redirect(`${origin}${LOGIN_PATH}`);
  }

  const profile = await fetchUserProfileByAuthId(session.user.id);
  const destination = profile.ok ? "/" : NICKNAME_PATH;

  logAuthRedirect("callback-success", destination, {
    userId: session.user.id,
    hasProfile: profile.ok,
  });

  return NextResponse.redirect(`${origin}${destination}`);
}
