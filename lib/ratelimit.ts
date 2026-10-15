// Basit sıklık sınırı: anahtar başına zaman penceresinde en fazla N istek. Anahtar hash'lenerek saklanır.
// v1: legacy/lib/ratelimit.js (Blob) → Postgres rate_limits tablosu. Eski satırlar günlük temizlik işinde silinir.
import { createHash } from "node:crypto";
import { and, count, eq, gt } from "drizzle-orm";
import { db, schema } from "@/lib/db";

const h = (s: string) => createHash("sha256").update(String(process.env.ADMIN_PASSWORD || "") + "|" + s).digest("hex").slice(0, 32);

export async function allow(key: string, max: number, windowMs: number): Promise<boolean> {
  const d = await db(), keyHash = h(key), since = new Date(Date.now() - windowMs);
  const [{ n }] = await d.select({ n: count() }).from(schema.rateLimits)
    .where(and(eq(schema.rateLimits.keyHash, keyHash), gt(schema.rateLimits.ts, since)));
  if (n >= max) return false;
  await d.insert(schema.rateLimits).values({ keyHash });
  return true;
}

// Vercel x-forwarded-for başlığını kendisi yazar (istemcinin gönderdiği değer sahtelemeye karşı ezilir).
// Vercel dışında (ör. kendi sunucuda next start) bu başlığa güvenilmez; orada önüne bir proxy konmalı.
export const clientIp = (request: Request) =>
  (request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "").split(",")[0].trim();
