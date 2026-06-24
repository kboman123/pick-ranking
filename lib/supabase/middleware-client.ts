import { NextResponse, type NextRequest } from "next/server";
import { isPublicPath, LOGIN_PATH } from "@/lib/auth-routes";
import { logAuthRedirect } from "@/lib/auth-redirect-log";
import { USER_ID_COOKIE } from "@/lib/user-session";

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = isPublicPath(pathname);
  const userId = request.cookies.get(USER_ID_COOKIE)?.value;

  if (!userId && !isPublic) {
    logAuthRedirect("middleware-no-session", LOGIN_PATH, { from: pathname });
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request });
}
