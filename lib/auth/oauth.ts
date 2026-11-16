import { createAppAuthorizeRedirect, exchangeCodeForAssertion } from "@yetvast/auth/server";

export function getAuthServerOrigin(): string {
  return process.env.YETVAST_AUTH_ORIGIN || "https://auth.yetvast.com";
}

export function getApplicationId(): Parameters<typeof createAppAuthorizeRedirect>[0]["applicationId"] {
  return (process.env.YETVAST_APP_ID || "vastalliance") as Parameters<typeof createAppAuthorizeRedirect>[0]["applicationId"];
}

export function getCallbackUri(origin: string): string {
  return `${origin.replace(/\/$/, "")}/api/auth/callback`;
}

/**
 * Initiates the Google OAuth PKCE flow against Yet Vast Auth.
 */
export function initiateYetVastGoogleLogin(appOrigin: string) {
  const authServerOrigin = getAuthServerOrigin();
  const applicationId = getApplicationId();
  const redirectUri = getCallbackUri(appOrigin);

  return createAppAuthorizeRedirect({
    authServerOrigin,
    applicationId,
    redirectUri,
    provider: "google",
  });
}

/**
 * Exchanges the single-use authorization code for a verified identity assertion.
 */
export async function exchangeYetVastCode(params: {
  code: string;
  codeVerifier: string;
  appOrigin: string;
  customJwksUrl?: string;
  fetchImpl?: typeof fetch;
}) {
  const authServerOrigin = getAuthServerOrigin();
  const applicationId = getApplicationId();
  const redirectUri = getCallbackUri(params.appOrigin);

  return exchangeCodeForAssertion({
    authServerOrigin,
    applicationId,
    code: params.code,
    redirectUri,
    codeVerifier: params.codeVerifier,
    jwksUrl: params.customJwksUrl || `${authServerOrigin}/.well-known/jwks.json`,
    expectedIssuer: authServerOrigin,
    expectedAudience: applicationId,
    fetchImpl: params.fetchImpl,
  });
}
