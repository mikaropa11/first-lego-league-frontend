import { setCookie } from "cookies-next";

export const AUTH_COOKIE_NAME = "APP_AUTH";

export function toBase64(value: string) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCodePoint(byte);
    }
    return btoa(binary);
}

export function setAuthCookie(username: string, password: string): void {
    const auth = "Basic " + toBase64(username + ":" + password);
    setCookie(AUTH_COOKIE_NAME, auth, {
        path: "/",
        secure: globalThis.location.protocol === "https:",
        sameSite: "strict",
        httpOnly: false,
    });
    localStorage.setItem(AUTH_COOKIE_NAME, auth);
}

export async function updateAuthCookie(
    authProvider: AuthStrategy,
    newPassword: string
): Promise<void> {
    const currentAuth = await authProvider.getAuth();
    if (!currentAuth) return;
    const decoded = atob(currentAuth.replace(/^Basic\s+/, ""));
    const username = decoded.substring(0, decoded.indexOf(":"));
    setAuthCookie(username, newPassword);
}

// Strategy interface — defines how to obtain the auth credentials
export interface AuthStrategy {
  getAuth(): Promise<string | null>;
}

// Reads the auth cookie from the server side (Next.js SSR)
export class ServerAuthStrategy implements AuthStrategy {
  async getAuth(): Promise<string | null> {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
  }
}

// Reads the auth cookie or localStorage from the browser
export class ClientAuthStrategy implements AuthStrategy {
  async getAuth(): Promise<string | null> {
    const cookie = new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`).exec(
      document.cookie
    )?.[1];
    if (cookie) return decodeURIComponent(cookie);
    return localStorage.getItem(AUTH_COOKIE_NAME) ?? null;
  }
}

export const serverAuthProvider: AuthStrategy = new ServerAuthStrategy();
export const clientAuthProvider: AuthStrategy = new ClientAuthStrategy();
