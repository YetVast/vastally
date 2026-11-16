import { NextRequest, NextResponse } from "next/server";
import { exchangeYetVastCode } from "@/lib/auth/oauth";
import { resolveUserRole } from "@/lib/auth/rbac";
import { OAUTH_COOKIE_NAME, SESSION_COOKIE_NAME, signSessionToken } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");

  const origin = request.nextUrl.origin;

  if (errorParam) {
    console.error("OAuth provider returned error:", errorParam, errorDesc);
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(errorDesc || errorParam)}`, origin)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/?auth_error=Missing+authorization+code+or+state", origin)
    );
  }

  // Verify OAuth state and codeVerifier from cookie
  const oauthCookie = request.cookies.get(OAUTH_COOKIE_NAME)?.value;
  if (!oauthCookie) {
    return NextResponse.redirect(
      new URL("/?auth_error=OAuth+session+expired.+Please+sign+in+again.", origin)
    );
  }

  let codeVerifier: string;
  try {
    const flowData = JSON.parse(oauthCookie);
    if (flowData.state !== state) {
      return NextResponse.redirect(
        new URL("/?auth_error=Invalid+OAuth+state+parameter.", origin)
      );
    }
    codeVerifier = flowData.codeVerifier;
  } catch {
    return NextResponse.redirect(
      new URL("/?auth_error=Corrupt+OAuth+state.", origin)
    );
  }

  try {
    const { assertion } = await exchangeYetVastCode({
      code,
      codeVerifier,
      appOrigin: origin,
    });

    if (!assertion.yvUserId) {
      return NextResponse.redirect(
        new URL("/?auth_error=Identity+assertion+missing+canonical+user+ID.", origin)
      );
    }

    const role = resolveUserRole(assertion.yvUserId);
    const sessionToken = signSessionToken({
      yvUserId: assertion.yvUserId,
      role,
      displayName: assertion.displayName,
      email: assertion.email,
      provider: "google",
      authenticatedAt: assertion.authenticatedAt,
    });

    const targetUrl = role === "ADMIN" ? "/adminDahsboard" : "/";
    const response = NextResponse.redirect(new URL(targetUrl, origin));

    // Set host-bound session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Clear temporary OAuth flow cookie
    response.cookies.delete(OAUTH_COOKIE_NAME);

    return response;
  } catch (error) {
    console.error("Token exchange failed:", error);
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent((error as Error).message)}`, origin)
    );
  }
}
