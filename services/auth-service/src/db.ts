import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DB_URL ?? "postgresql://game:game@localhost:5432/ai_game",
});

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username    VARCHAR(50) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT now()
    )
  `);
}
