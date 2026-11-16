import { NextRequest, NextResponse } from "next/server";
import { initiateYetVastGoogleLogin } from "@/lib/auth/oauth";
import { OAUTH_COOKIE_NAME } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin;
    const { authorizeUrl, state, codeVerifier } = initiateYetVastGoogleLogin(origin);

    const flowData = JSON.stringify({ state, codeVerifier });
    const response = NextResponse.redirect(authorizeUrl);

    response.cookies.set({
      name: OAUTH_COOKIE_NAME,
      value: flowData,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error("Sign-in initiation failed:", error);
    return NextResponse.json(
      { error: "Failed to initiate sign-in", details: (error as Error).message },
      { status: 500 }
    );
  }
}
