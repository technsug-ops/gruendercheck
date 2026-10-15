// Yönetici oturumu: şifre bir kez POST ile gönderilir, karşılığında HttpOnly + Secure + SameSite=Strict çerez.
// Çerez = son kullanma zamanı + HMAC imzası. Anahtar ADMIN_PASSWORD'dan türetilir: şifre değişince tüm oturumlar düşer.
// Sadece yönetici için, giriş için zorunlu çerez (onay gerekmez). v1'deki Bearer + sessionStorage'ın yerine.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "fc_admin";
export const SESSION_SECONDS = 12 * 3600;

const secret = () => process.env.ADMIN_PASSWORD || "";
const sign = (exp: number) => createHmac("sha256", "fc-admin-session|" + secret()).update(String(exp)).digest("base64url");
const sameHash = (a: string, b: string) =>
  timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());

/** Şifre kontrolü; hash karşılaştırması uzunluk sızdırmaz. */
export function passwordOk(given: unknown): boolean {
  const expected = secret();
  return !!expected && typeof given === "string" && !!given && sameHash(expected, given);
}

export function createSession(now = Date.now()): { value: string; maxAge: number } {
  const exp = Math.floor(now / 1000) + SESSION_SECONDS;
  return { value: `${exp}.${sign(exp)}`, maxAge: SESSION_SECONDS };
}

export function sessionOk(value: string | undefined, now = Date.now()): boolean {
  if (!secret() || !value) return false;
  const [expStr, mac] = value.split(".");
  const exp = Number(expStr);
  if (!Number.isInteger(exp) || !mac || exp < Math.floor(now / 1000)) return false;
  return sameHash(mac, sign(exp));
}

/** Route handler'larda: isteğin çerezinden yönetici mi? */
export function isAdmin(request: Request): boolean {
  const raw = request.headers.get("cookie") || "";
  const m = raw.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  return sessionOk(m ? decodeURIComponent(m[1]) : undefined);
}

export const cookieOptions = (maxAge: number) =>
  ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge });
