const ACCESS_TOKEN_KEY = "verimarka_access_token";
const REFRESH_TOKEN_KEY = "verimarka_refresh_token";

function readStorage(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage errors.
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Remove legacy localStorage tokens when possible.
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

export function setTokens(access: string): void {
  writeStorage(ACCESS_TOKEN_KEY, access);
  removeStorage(REFRESH_TOKEN_KEY);
}

export function setAccessToken(access: string): void {
  writeStorage(ACCESS_TOKEN_KEY, access);
}

export function clearTokens(): void {
  removeStorage(ACCESS_TOKEN_KEY);
  removeStorage(REFRESH_TOKEN_KEY);
}
