const ACCESS_TOKEN_KEY = "verimarka_access_token";
const REFRESH_TOKEN_KEY = "verimarka_refresh_token";

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      // Ignore storage errors and let caller continue.
    }
  }
}

function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore and try session storage too.
  }

  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore storage errors.
  }
}

export function getAccessToken(): string | null {
  return readStorage(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return readStorage(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh: string): void {
  writeStorage(ACCESS_TOKEN_KEY, access);
  writeStorage(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens(): void {
  removeStorage(ACCESS_TOKEN_KEY);
  removeStorage(REFRESH_TOKEN_KEY);
}
