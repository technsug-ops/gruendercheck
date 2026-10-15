// Uçtan uca test için sahte Anthropic Messages API (akışlı yanıt). SDK'ya ANTHROPIC_BASE_URL ile verilir;
// böylece gerçek SDK + akış + taslak ayrıştırma yolu çalışır, maliyet yok. İstek gövdeleri dosyaya yazılır
// (modele isim/e-posta gitmediğini test kontrol eder).
import { appendFileSync } from "node:fs";
import { createServer } from "node:http";

export const MOCK_REPORT = [
  "===HALİL===",
  "- Hat der Gründer schon einen Mietvertrag?",
  "===RAPOR===",
  "# Mobile Fahrradwerkstatt",
  "Frankfurt · Einzelgründung",
  "",
  "{{skor 68 | gelb | Trägt mit Auflagen: Preise prüfen.}}",
  "",
  "## 1. Markt",
  "Pendler zahlen für Zeitersparnis (Annahme).",
].join("\n");

export function startMockAnthropic(port: number, logFile: string) {
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      appendFileSync(logFile, body + "\n");
      if (!req.url?.startsWith("/v1/messages")) { res.writeHead(404); return res.end(); }
      const parsed = JSON.parse(body || "{}");
      const ev = (type: string, data: object) => `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`;
      const usage = { input_tokens: 1200, output_tokens: 300, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" });
      res.write(ev("message_start", { message: { id: "msg_e2e", type: "message", role: "assistant", model: parsed.model, content: [], stop_reason: null, stop_sequence: null, usage } }));
      res.write(ev("content_block_start", { index: 0, content_block: { type: "text", text: "" } }));
      for (const part of MOCK_REPORT.match(/[\s\S]{1,40}/g)!) res.write(ev("content_block_delta", { index: 0, delta: { type: "text_delta", text: part } }));
      res.write(ev("content_block_stop", { index: 0 }));
      res.write(ev("message_delta", { delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 300 } }));
      res.write(ev("message_stop", {}));
      res.end();
    });
  });
  server.listen(port);
  return server;
}
