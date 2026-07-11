export const AUTH_COOKIE = "kol_session";
const SESSION_DAYS = 14;

function getCredentials() {
  const username = process.env.AUTH_USERNAME?.trim() ?? "";
  const password = process.env.AUTH_PASSWORD ?? "";
  const secret = process.env.AUTH_SECRET?.trim() || "beautycam-jp-kol-dev-secret";
  return { username, password, secret };
}

export function isAuthConfigured(): boolean {
  const { username, password } = getCredentials();
  return Boolean(username && password);
}

function encodeUtf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function hmacSign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encodeUtf8(secret) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encodeUtf8(payload) as BufferSource,
  );
  return toBase64Url(signature);
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function verifyCredentials(username: string, password: string): boolean {
  const creds = getCredentials();
  if (!creds.username || !creds.password) return false;
  return (
    timingSafeEqualString(username, creds.username) &&
    timingSafeEqualString(password, creds.password)
  );
}

export async function createSessionToken(username: string): Promise<string> {
  const { secret } = getCredentials();
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = toBase64Url(encodeUtf8(JSON.stringify({ u: username, exp })));
  const signature = await hmacSign(payload, secret);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<string | null> {
  if (!token) return null;
  const { secret } = getCredentials();
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = await hmacSign(payload, secret);
  if (!timingSafeEqualString(signature, expected)) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as {
      u?: string;
      exp?: number;
    };
    if (!data.u || !data.exp || Date.now() > data.exp) return null;
    return data.u;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAgeSeconds = SESSION_DAYS * 24 * 60 * 60) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
