const ACCESS_TOKEN_KEY = "verimarka_access_token";
const REFRESH_TOKEN_KEY = "verimarka_refresh_token";

type StorageTarget = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getPreferredStorage(): StorageTarget | null {
  try {
    const probe = "__verimarka_storage_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    try {
      const probe = "__verimarka_storage_probe__";
      window.sessionStorage.setItem(probe, "1");
      window.sessionStorage.removeItem(probe);
      return window.sessionStorage;
    } catch {
      return null;
    }
  }
}

function readStorage(key: string): string | null {
  try {
    const localValue = window.localStorage.getItem(key);
    if (localValue) return localValue;
  } catch {
    // Ignore and fall back to session storage.
  }

  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  const storage = getPreferredStorage();
  storage?.setItem(key, value);

  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore cleanup failures.
  }

  if (storage !== window.localStorage) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore cleanup failures.
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

export function setAccessToken(access: string): void {
  writeStorage(ACCESS_TOKEN_KEY, access);
}

export function clearTokens(): void {
  removeStorage(ACCESS_TOKEN_KEY);
  removeStorage(REFRESH_TOKEN_KEY);
}
