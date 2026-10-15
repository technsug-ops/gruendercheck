// Uçtan uca tarayıcı testi: npm run e2e (önce build alır, boş bir test veritabanıyla sunucuyu başlatır).
// Gerçek dış servis yok: e-posta deneme modunda dosyaya, Claude çağrısı sahte sunucuya gider.
import { defineConfig } from "@playwright/test";

const PORT = 3300, MOCK = 3301;
export const E2E = { url: `http://localhost:${PORT}`, outbox: ".data/e2e/outbox.jsonl", claudeLog: ".data/e2e/claude.jsonl", password: "e2e-sifre" };

export default defineConfig({
  testDir: "e2e",
  timeout: 180_000,
  workers: 1,
  reporter: "list",
  use: { baseURL: E2E.url, locale: "de-DE", timezoneId: "Europe/Berlin", serviceWorkers: "block" },
  webServer: [
    { command: `npx tsx e2e/mock-main.ts ${MOCK}`, port: MOCK, reuseExistingServer: false },
    {
      command: `npx next start -p ${PORT}`,
      url: `${E2E.url}/de`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        PGLITE_DIR: ".data/e2e/db", MAIL_DRY: "1", MAIL_OUTBOX: E2E.outbox, SMTP_USER: "e2e", SMTP_PASS: "e2e",
        MAIL_FROM: "rapor@example.org", NOTIFY_TO: "halil@example.org", ADMIN_PASSWORD: E2E.password,
        ANTHROPIC_API_KEY: "e2e", ANTHROPIC_BASE_URL: `http://localhost:${MOCK}`, ANTHROPIC_MODEL: "claude-sonnet-5-5",
        DATABASE_URL: "",
      },
    },
  ],
});
