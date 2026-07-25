import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/manholes"];

export function middleware(req: NextRequest) {
  const token = req.cookies.get("manhole_admin_token")?.value;
  const isProtected = PROTECTED_PREFIXES.some((p) =>
    req.nextUrl.pathname.startsWith(p)
  );

  if (isProtected && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/manholes/:path*"],
};
