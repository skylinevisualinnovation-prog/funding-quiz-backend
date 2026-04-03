export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL safely (will NOT crash app if env vars missing)
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // If OAuth is not configured, disable login gracefully
  if (!oauthPortalUrl || !appId) {
    console.warn("OAuth not configured. Login disabled.");
    return null;
  }

  try {
    const redirectUri = `${window.location.origin}/api/oauth/callback`;
    const state = btoa(redirectUri);

    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch (error) {
    console.error("Failed to construct OAuth URL:", error);
    return null;
  }
};