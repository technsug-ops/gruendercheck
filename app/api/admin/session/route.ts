// Yönetici girişi: POST { password } → HttpOnly çerez; DELETE → çıkış; GET → oturum açık mı.
// v1'de şifre sessionStorage'da tutulup her istekte Bearer olarak gönderiliyordu.
import { ADMIN_COOKIE, cookieOptions, createSession, isAdmin, passwordOk } from "@/lib/auth";
import { json, readJson } from "@/lib/http";
import { allow, clientIp } from "@/lib/ratelimit";

const HOUR = 3600 * 1000;

const withCookie = (res: Response, value: string, maxAge: number) => {
  const o = cookieOptions(maxAge);
  res.headers.append("set-cookie",
    `${ADMIN_COOKIE}=${encodeURIComponent(value)}; Path=${o.path}; Max-Age=${o.maxAge}; HttpOnly; SameSite=Strict${o.secure ? "; Secure" : ""}`);
  return res;
};

export async function GET(request: Request) {
  return json({ ok: isAdmin(request) });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) return json({ ok: false, error: "forbidden" }, 403);
  // Şifre denemesi sınırı: IP başına saatte 10.
  if (!(await allow("login:" + clientIp(request), 10, HOUR))) return json({ ok: false, error: "rate" }, 429);
  const body = await readJson(request, 2000);
  if ("error" in body) return body.error;
  if (!passwordOk(body.data.password)) return json({ ok: false, error: "unauthorized" }, 401);
  const s = createSession();
  return withCookie(json({ ok: true }), s.value, s.maxAge);
}

export async function DELETE() {
  return withCookie(json({ ok: true }), "", 0);
}
