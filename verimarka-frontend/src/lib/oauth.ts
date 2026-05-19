type OAuthProvider = "apple" | "google" | "kakao";

const CALLBACK_PATHS: Record<OAuthProvider, string> = {
  apple: "/auth/apple/callback",
  google: "/auth/google/callback",
  kakao: "/auth/kakao/callback",
};

const CONFIGURED_REDIRECT_URIS: Record<OAuthProvider, string | undefined> = {
  apple: import.meta.env.VITE_APPLE_REDIRECT_URI,
  google: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
  kakao: import.meta.env.VITE_KAKAO_REDIRECT_URI,
};

export function getOAuthRedirectUri(provider: OAuthProvider) {
  const configuredRedirectUri = CONFIGURED_REDIRECT_URIS[provider];
  const callbackPath = CALLBACK_PATHS[provider];

  if (typeof window === "undefined") {
    return configuredRedirectUri || callbackPath;
  }

  if (!configuredRedirectUri) {
    return `${window.location.origin}${callbackPath}`;
  }

  try {
    const configuredUrl = new URL(configuredRedirectUri);
    if (configuredUrl.origin === window.location.origin) {
      return `${configuredUrl.origin}${configuredUrl.pathname}`;
    }
  } catch {
    return `${window.location.origin}${callbackPath}`;
  }

  return `${window.location.origin}${callbackPath}`;
}
