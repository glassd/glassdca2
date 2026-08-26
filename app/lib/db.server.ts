import postgres from "postgres";

/**
 * Optional Postgres connection.
 *
 * DATABASE_URL is deliberately optional: with it unset the app runs
 * exactly as before, keeping abuse counters in process memory. That keeps
 * local development and any deploy without a database working, and means
 * a database outage degrades the contact form rather than breaking it.
 */

let sql: postgres.Sql | null | undefined;
let schemaReady: Promise<void> | null = null;

export function getSql(): postgres.Sql | null {
  if (sql !== undefined) return sql;

  const url = process.env.DATABASE_URL;
  if (!url) {
    sql = null;
    return sql;
  }

  try {
    sql = postgres(url, {
      // The contact form is the only consumer; a large pool would be
      // idle connections held open for nothing.
      max: 4,
      idle_timeout: 30,
      connect_timeout: 10,
      onnotice: () => {},
    });
  } catch (error) {
    console.error("[db] Failed to initialise Postgres, using memory:", {
      message: (error as Error)?.message || String(error),
    });
    sql = null;
  }

  return sql;
}

/**
 * Create the abuse tables if they don't exist. Runs at most once per
 * process; callers await it before their first query. Kept here rather
 * than in a migration tool because these two tables are the whole schema
 * and they are pure cache — losing them costs nothing.
 */
export function ensureSchema(db: postgres.Sql): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await db`
        CREATE TABLE IF NOT EXISTS rate_limit (
          key        text PRIMARY KEY,
          count      integer     NOT NULL,
          expires_at timestamptz NOT NULL
        )
      `;
      await db`
        CREATE TABLE IF NOT EXISTS submission_hash (
          key        text PRIMARY KEY,
          hash       text        NOT NULL,
          expires_at timestamptz NOT NULL
        )
      `;
      await db`
        CREATE INDEX IF NOT EXISTS rate_limit_expires_at_idx
          ON rate_limit (expires_at)
      `;
      await db`
        CREATE INDEX IF NOT EXISTS submission_hash_expires_at_idx
          ON submission_hash (expires_at)
      `;
    })().catch((error) => {
      // Reset so a later request can retry rather than being stuck with
      // a permanently rejected promise.
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

/** Test seam — drops the memoised connection and schema promise. */
export function resetDbForTests() {
  sql = undefined;
  schemaReady = null;
}
