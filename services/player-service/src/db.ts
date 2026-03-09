import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DB_URL ?? "postgresql://game:game@localhost:5432/ai_game",
});

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS characters (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      account_id UUID NOT NULL,
      name       VARCHAR(50) UNIQUE NOT NULL,
      class      VARCHAR(20) NOT NULL CHECK (class IN ('warrior','archer','magician')),
      level      INTEGER NOT NULL DEFAULT 1,
      xp         INTEGER NOT NULL DEFAULT 0,
      hp         INTEGER NOT NULL DEFAULT 100,
      max_hp     INTEGER NOT NULL DEFAULT 100,
      mp         INTEGER NOT NULL DEFAULT 50,
      max_mp     INTEGER NOT NULL DEFAULT 50,
      atk        INTEGER NOT NULL DEFAULT 10,
      def        INTEGER NOT NULL DEFAULT 5,
      x          REAL NOT NULL DEFAULT 0,
      y          REAL NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);
}
