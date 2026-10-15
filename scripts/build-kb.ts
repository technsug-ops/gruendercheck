// Rapor talimatı ve Almanya kural tabanı: docs/kb/*.md → lib/ai/kb.ts (ve v1 için legacy/lib/kb.js).
// Kaynak: claude.ai projesindeki RAPOR-TALIMATI.md ve ALMANYA-KURAL-TABANI.md. Yeni sürüm gelince dosyayı
// docs/kb/ altında değiştir ve çalıştır: npm run kb
// KB_VERSION, kural tabanının ilk satırındaki "(GG.AA.YYYY dışa aktarım)" tarihinden alınır.
import { readFileSync, writeFileSync } from "node:fs";

const talimat = readFileSync("docs/kb/RAPOR-TALIMATI.md", "utf8").replace(/\r\n/g, "\n");
const kural = readFileSync("docs/kb/ALMANYA-KURAL-TABANI.md", "utf8").replace(/\r\n/g, "\n");

const m = kural.match(/\((\d{2})\.(\d{2})\.(\d{4}) dışa aktarım\)/);
if (!m) throw new Error('Kural tabanının ilk satırında "(GG.AA.YYYY dışa aktarım)" tarihi bulunamadı');
const version = `${m[3]}-${m[2]}-${m[1]}`;

const body = (exp: string) => [
  `${exp} const KB_VERSION = ${JSON.stringify(version)};`,
  `${exp} const RAPOR_TALIMATI = ${JSON.stringify(talimat)};`,
  `${exp} const KURAL_TABANI = ${JSON.stringify(kural)};`,
  "",
].join("\n");

const header = "// Otomatik üretildi (scripts/build-kb.ts): docs/kb/RAPOR-TALIMATI.md ve docs/kb/ALMANYA-KURAL-TABANI.md.\n// Elle düzenleme; kaynağı değiştirip `npm run kb` çalıştır.\n";
writeFileSync("lib/ai/kb.ts", header + body("export"));
// v1 (canlı) aynı içeriği kullanır; yayınlanması ayrı bir adımdır.
writeFileSync("legacy/lib/kb.js", header + body("export"));
console.log(`kb ${version}: talimat ${talimat.length} karakter, kural tabanı ${kural.length} karakter`);
