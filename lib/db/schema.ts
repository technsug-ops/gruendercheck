import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true });
const cascade = { onDelete: "cascade" } as const;

export const STATUSES = ["new", "report_sent", "feedback", "follow_up", "plan_link_sent", "plan_sent", "paid", "closed"] as const;
export type Status = (typeof STATUSES)[number];

/** Başvuru. answers: formdaki tüm alanlar (isim/e-posta hariç; onlar ayrı sütunda). */
export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: ts("created_at").notNull().defaultNow(),
    lang: text("lang").$type<"de" | "tr">().notNull(),
    status: text("status").$type<Status>().notNull().default("new"),
    statusChangedAt: ts("status_changed_at"),
    confirmed: boolean("confirmed").notNull().default(false),
    confirmTokenHash: text("confirm_token_hash"),
    confirmedAt: ts("confirmed_at"),
    src: text("src"),
    email: text("email").notNull(),
    firstName: text("first_name"),
    answers: jsonb("answers").$type<Record<string, string | boolean>>().notNull(),
    consentAt: ts("consent_at").notNull(),
    reportSentAt: ts("report_sent_at"),
  },
  (t) => [index("submissions_created_idx").on(t.createdAt), index("submissions_email_idx").on(t.email)],
);

export type DraftState = "pending" | "ready" | "insufficient" | "error";

export const drafts = pgTable("drafts", {
  submissionId: uuid("submission_id").primaryKey().references(() => submissions.id, cascade),
  state: text("state").$type<DraftState>().notNull(),
  md: text("md"),
  precheck: text("precheck"),
  message: text("message"),
  model: text("model"),
  kb: text("kb"),
  seconds: integer("seconds"),
  usage: jsonb("usage"),
  stopReason: text("stop_reason"),
  error: text("error"),
  createdAt: ts("created_at").notNull().defaultNow(),
  editedAt: ts("edited_at"),
});

export const reports = pgTable("reports", {
  submissionId: uuid("submission_id").primaryKey().references(() => submissions.id, cascade),
  md: text("md").notNull(),
  sentAt: ts("sent_at").notNull().defaultNow(),
});

export const feedback = pgTable("feedback", {
  submissionId: uuid("submission_id").primaryKey().references(() => submissions.id, cascade),
  useful: text("useful").notNull(),
  next: text("next").notNull(),
  wtp: text("wtp").notNull(),
  best: text("best"),
  missing: text("missing"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const plans = pgTable("plans", {
  submissionId: uuid("submission_id").primaryKey().references(() => submissions.id, cascade),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

/** Sıklık sınırı: her istek bir satır; anahtar (e-posta/IP) hash'li. */
export const rateLimits = pgTable(
  "rate_limits",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    keyHash: text("key_hash").notNull(),
    ts: ts("ts").notNull().defaultNow(),
  },
  (t) => [index("rate_limits_key_ts_idx").on(t.keyHash, t.ts)],
);
