import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const config = {
  matcher: ["/", "/user/:path*", "/admin/:path*"],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = pathname.startsWith("/user") || pathname.startsWith("/admin");

  let isAuthenticated = false;
  let role: "user" | "admin" | null = null;

  if (API_URL) {
    try {
      const meResponse = await fetch(`${API_URL}/auth/me`, {
        headers: {
          cookie: request.headers.get("cookie") ?? "",
        },
      });
      isAuthenticated = meResponse.ok;
      if (isAuthenticated) {
        const data = await meResponse.json();
        role = data.role;
      }
    } catch {
      // Backend unreachable — treat as unauthenticated instead of crashing
      isAuthenticated = false;
    }
  }

  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (isAuthenticated && pathname === "/") {
    return NextResponse.redirect(new URL(role === "admin" ? "/admin" : "/user", request.url));
  }
  if (isAuthenticated && role === "user" && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/user", request.url));
  }
  if (isAuthenticated && role === "admin" && pathname.startsWith("/user")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return NextResponse.next();
}