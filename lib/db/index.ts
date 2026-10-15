import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type DB = NeonHttpDatabase<typeof schema>;

// globalThis: geliştirmede sıcak yeniden yüklemede ikinci bir bağlantı (ve PGlite kilit hatası) olmasın.
const g = globalThis as { __fcDb?: Promise<DB> };

async function create(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  if (url) return drizzle(neon(url), { schema });
  // Vercel'de gömülü veritabanına asla düşme (yerelde next start ile denemek serbest).
  if (process.env.VERCEL) throw new Error("DATABASE_URL tanımlı değil");
  // Yerel geliştirme ve testler: gömülü Postgres (PGlite), veri .data/pglite klasöründe.
  // Sorgu arayüzü neon-http ile aynı; tip tek olsun diye DB olarak kullanılır.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dir = process.env.PGLITE_DIR ?? ".data/pglite";
  // "memory://": testlerde her çalıştırma için boş, bellek içi veritabanı.
  if (!dir.startsWith("memory://")) (await import("node:fs")).mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  const db = drizzlePglite(client, { schema });
  await migrate(db, { migrationsFolder: "drizzle" });
  return db as unknown as DB;
}

/** İlk kullanımda bağlanır (build sırasında DATABASE_URL gerekmez). */
export const db = () => (g.__fcDb ??= create());
export { schema };
