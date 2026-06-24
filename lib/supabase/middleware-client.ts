import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isPublicPath, LOGIN_PATH } from "@/lib/auth-routes";
import { logAuthRedirect } from "@/lib/auth-redirect-log";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const { url, publishableKey } = getSupabaseEnv();
  if (!url || !publishableKey) {
    return response;
  }

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;
  const isPublic = isPublicPath(pathname);

  if (!session && !isPublic) {
    logAuthRedirect("middleware-no-session", LOGIN_PATH, { from: pathname });
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
