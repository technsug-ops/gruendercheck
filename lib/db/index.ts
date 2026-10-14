import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: ReturnType<typeof create> | undefined;
function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tanımlı değil");
  return drizzle(neon(url), { schema });
}

/** İlk kullanımda bağlanır (build sırasında DATABASE_URL gerekmez). */
export const db = () => (_db ??= create());
export { schema };
