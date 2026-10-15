// Her e2e çalıştırması boş bir veritabanı ve boş e-posta kutusuyla başlar.
import { mkdirSync, rmSync } from "node:fs";

rmSync(".data/e2e", { recursive: true, force: true });
mkdirSync(".data/e2e", { recursive: true });
