import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { migrateData } from "@/lib/ledger/store";
import type { Line, Payment, Phase, Project } from "@/lib/ledger/types";

export type BookPayload = {
  project: Project;
  phases: Phase[];
  lines: Line[];
  payments: Payment[];
};

function clean(input: unknown): BookPayload {
  if (!input || typeof input !== "object") throw new Error("That book could not be read.");
  return migrateData(input as Partial<BookPayload>);
}

function parseRow(raw: string): BookPayload {
  return clean(JSON.parse(raw) as unknown);
}

export function mergeBooks(local: BookPayload, server: BookPayload): BookPayload {
  const localAt = local.project.editedAt ?? 0;
  const serverAt = server.project.editedAt ?? 0;
  const newer = localAt >= serverAt ? local : server;
  const older = newer === local ? server : local;
  const lines = [...newer.lines];
  const lineIds = new Set(lines.map((line) => line.id));
  for (const line of older.lines) {
    if (!lineIds.has(line.id)) lines.push(line);
  }
  const payments = [...newer.payments];
  const paymentIds = new Set(payments.map((payment) => payment.id));
  for (const payment of older.payments) {
    if (!paymentIds.has(payment.id)) payments.push(payment);
  }
  const phases = [...newer.phases];
  const phaseIds = new Set(phases.map((phase) => phase.id));
  for (const phase of older.phases) {
    if (!phaseIds.has(phase.id)) phases.push(phase);
  }
  return { project: newer.project, phases, lines, payments };
}

export const loadBook = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ data: string; share_token: string }>`
      select data, share_token from books where user_id = ${context.userId}
    `;
    const row = rows[0];
    if (!row) return null;
    return { book: parseRow(row.data), shareToken: row.share_token };
  });

export const saveBook = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: BookPayload) => clean(input))
  .handler(async ({ data, context }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ data: string; share_token: string }>`
      select data, share_token from books where user_id = ${context.userId}
    `;
    const current = rows[0];
    if (current) {
      const previous = parseRow(current.data);
      if ((previous.project.editedAt ?? 0) > (data.project.editedAt ?? 0)) {
        return { shareToken: current.share_token };
      }
    }
    const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
    const saved = await sql<{ share_token: string }>`
      insert into books (user_id, data, share_token)
      values (${context.userId}, ${JSON.stringify(data)}, ${token})
      on conflict (user_id) do update
        set data = excluded.data,
            updated_at = now()
      returning share_token
    `;
    return { shareToken: saved[0]?.share_token ?? token };
  });

export const loadSharedBook = createServerFn({ method: "GET" })
  .validator((token: string) => {
    const value = token.trim();
    if (!/^[a-f0-9]{32,80}$/.test(value)) throw new Error("Bad link");
    return value;
  })
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ data: string }>`
      select data from books where share_token = ${data}
    `;
    const row = rows[0];
    if (!row) return null;
    return parseRow(row.data);
  });
