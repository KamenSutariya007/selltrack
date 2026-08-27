import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (!token.emailVerified && path !== "/verify-email") {
      return NextResponse.redirect(new URL("/verify-email", req.url));
    }

    if (token.status !== "active") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/orders/:path*",
    "/products/:path*",
    "/returns/:path*",
    "/payments/:path*",
    "/expenses/:path*",
    "/reports/:path*",
    "/notifications/:path*",
    "/scan/:path*",
    "/menu/:path*",
    "/settings/:path*",
  ],
};
