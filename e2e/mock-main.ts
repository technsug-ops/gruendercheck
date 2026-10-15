import { startMockAnthropic } from "./mock-anthropic";

startMockAnthropic(Number(process.argv[2] || 3301), ".data/e2e/claude.jsonl");
