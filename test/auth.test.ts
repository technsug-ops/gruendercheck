import { afterEach, describe, expect, it } from "vitest";
import { ADMIN_COOKIE, createSession, isAdmin, passwordOk, sessionOk } from "@/lib/auth";

const withPw = (pw: string | undefined) => { if (pw === undefined) delete process.env.ADMIN_PASSWORD; else process.env.ADMIN_PASSWORD = pw; };
afterEach(() => withPw(undefined));

describe("admin oturumu", () => {
  it("şifre", () => {
    withPw("gizli-şifre");
    expect(passwordOk("gizli-şifre")).toBe(true);
    expect(passwordOk("gizli")).toBe(false);
    expect(passwordOk("")).toBe(false);
    expect(passwordOk(undefined)).toBe(false);
    withPw("");
    expect(passwordOk("")).toBe(false); // şifre tanımlı değilse kimse giremez
  });
  it("çerez imzası, süre ve şifre değişimi", () => {
    withPw("a");
    const now = Date.UTC(2026, 9, 15);
    const s = createSession(now);
    expect(sessionOk(s.value, now)).toBe(true);
    expect(sessionOk(s.value, now + (s.maxAge + 1) * 1000)).toBe(false); // süresi doldu
    const [exp, mac] = s.value.split(".");
    expect(sessionOk(`${Number(exp) + 3600}.${mac}`, now)).toBe(false); // süre uzatılamaz
    expect(sessionOk("x", now)).toBe(false);
    withPw("b");
    expect(sessionOk(s.value, now)).toBe(false); // şifre değişince oturum düşer
  });
  it("istekten okuma", () => {
    withPw("a");
    const s = createSession();
    expect(isAdmin(new Request("http://x", { headers: { cookie: `foo=1; ${ADMIN_COOKIE}=${encodeURIComponent(s.value)}` } }))).toBe(true);
    expect(isAdmin(new Request("http://x", { headers: { authorization: "Bearer a" } }))).toBe(false);
  });
});
