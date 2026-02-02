import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createGuestSession } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get("redirectUrl") || "/";

  // Check if user already has a session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Create guest user and session
  const { user: guestUser, session: guestSession } = await createGuestSession();

  // Create response with redirect
  const response = NextResponse.redirect(new URL(redirectUrl, request.url));
  
  // Set the session cookie
  response.cookies.set("better-auth.session_token", guestSession.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
