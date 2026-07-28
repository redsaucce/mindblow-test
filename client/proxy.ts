import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const config = {
  matcher: ["/", "/user/:path*", "/admin/:path*"],
};

async function checkAuth(
  cookieHeader: string
): Promise<{ isAuthenticated: boolean; role: "user" | "admin" | null }> {
  try {
    const meResponse = await fetch(`${API_URL}/auth/me`, {
      headers: { cookie: cookieHeader },
    });
    if (meResponse.ok) {
      const data = await meResponse.json();
      return { isAuthenticated: true, role: data.role };
    }
    return { isAuthenticated: false, role: null };
  } catch {
    return { isAuthenticated: false, role: null };
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = pathname.startsWith("/user") || pathname.startsWith("/admin");
  const cookieHeader = request.headers.get("cookie") ?? "";

  let isAuthenticated = false;
  let role: "user" | "admin" | null = null;
  let response = NextResponse.next();

  if (API_URL) {
    const first = await checkAuth(cookieHeader);
    isAuthenticated = first.isAuthenticated;
    role = first.role;

    // Access token expired but a refresh token may still be valid — try once
    // before treating the user as logged out.
    if (!isAuthenticated) {
      try {
        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { cookie: cookieHeader },
        });

        if (refreshResponse.ok) {
          const setCookieHeader = refreshResponse.headers.get("set-cookie");
          if (setCookieHeader) {
            response.headers.append("set-cookie", setCookieHeader);
          }

          const data = await refreshResponse.json();
          isAuthenticated = true;
          role = data.role;
        }
      } catch {
        // Refresh attempt failed — fall through, treated as unauthenticated
      }
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

  return response;
}