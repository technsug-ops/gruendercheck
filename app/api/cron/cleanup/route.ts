// Günlük silme işi (vercel.json crons). Vercel, isteğe "Authorization: Bearer <CRON_SECRET>" ekler.
import { timingSafeEqual, createHash } from "node:crypto";
import { json } from "@/lib/http";
import { cleanup } from "@/lib/retention";

const same = (a: string, b: string) =>
  timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = (request.headers.get("authorization") || "").replace(/^Bearer /, "");
  if (!secret || !given || !same(secret, given)) return json({ error: "unauthorized" }, 401);
  const res = await cleanup();
  console.log("cleanup", res); // sadece sayılar, kişisel veri yok
  return json({ ok: true, ...res });
}
