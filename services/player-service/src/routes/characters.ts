import type { FastifyPluginAsync } from "fastify";
import { pool } from "../db.js";
import { requireAuth, type AuthPayload } from "../auth.js";

const CLASS_STATS: Record<string, { hp: number; mp: number; atk: number; def: number }> = {
  warrior:  { hp: 150, mp: 30,  atk: 15, def: 10 },
  archer:   { hp: 100, mp: 50,  atk: 12, def: 6  },
  magician: { hp: 80,  mp: 120, atk: 18, def: 4  },
};

/** XP required to reach the next level (level 1 → 2 needs 100 XP, etc.) */
export function xpForNextLevel(level: number): number {
  return level * 100;
}

export const characterRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireAuth);

  // List characters for the authenticated account
  app.get("/characters", async (req) => {
    const { accountId } = (req as any).account as AuthPayload;
    const result = await pool.query(
      "SELECT * FROM characters WHERE account_id = $1 ORDER BY created_at",
      [accountId],
    );
    return { characters: result.rows };
  });

  // Create a new character
  app.post<{ Body: { name: string; class: string } }>(
    "/characters",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "class"],
          properties: {
            name:  { type: "string", minLength: 2, maxLength: 50 },
            class: { type: "string", enum: ["warrior", "archer", "magician"] },
          },
        },
      },
    },
    async (req, reply) => {
      const { accountId } = (req as any).account as AuthPayload;
      const { name } = req.body;
      const cls = req.body.class;

      const count = await pool.query(
        "SELECT COUNT(*) FROM characters WHERE account_id = $1",
        [accountId],
      );
      if (Number((count.rows[0] as any).count) >= 5) {
        return reply.code(400).send({ error: "Max 5 characters per account" });
      }

      const stats = CLASS_STATS[cls] ?? CLASS_STATS.warrior;
      try {
        const result = await pool.query(
          `INSERT INTO characters (account_id, name, class, hp, max_hp, mp, max_mp, atk, def)
           VALUES ($1, $2, $3, $4, $4, $5, $5, $6, $7)
           RETURNING *`,
          [accountId, name, cls, stats.hp, stats.mp, stats.atk, stats.def],
        );
        return reply.code(201).send(result.rows[0]);
      } catch (err: any) {
        if (err.code === "23505") {
          return reply.code(409).send({ error: "Character name already taken" });
        }
        throw err;
      }
    },
  );

  // Get a single character (must belong to this account)
  app.get<{ Params: { id: string } }>("/characters/:id", async (req, reply) => {
    const { accountId } = (req as any).account as AuthPayload;
    const result = await pool.query(
      "SELECT * FROM characters WHERE id = $1 AND account_id = $2",
      [req.params.id, accountId],
    );
    if (result.rows.length === 0) {
      return reply.code(404).send({ error: "Character not found" });
    }
    return result.rows[0];
  });

  // Internal endpoint (called by gateway to save HP/XP after combat)
  app.patch<{ Params: { id: string }; Body: { hp?: number; xp?: number; level?: number; x?: number; y?: number } }>(
    "/characters/:id",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            hp:    { type: "number" },
            xp:    { type: "number" },
            level: { type: "number" },
            x:     { type: "number" },
            y:     { type: "number" },
          },
        },
      },
    },
    async (req, reply) => {
      const { accountId } = (req as any).account as AuthPayload;
      const fields = req.body;
      const sets: string[] = [];
      const values: any[] = [];
      let i = 1;
      for (const [key, val] of Object.entries(fields)) {
        if (val !== undefined) {
          sets.push(`${key} = $${i++}`);
          values.push(val);
        }
      }
      if (sets.length === 0) {
        return reply.code(400).send({ error: "Nothing to update" });
      }
      values.push(req.params.id, accountId);
      const result = await pool.query(
        `UPDATE characters SET ${sets.join(", ")} WHERE id = $${i} AND account_id = $${i + 1} RETURNING *`,
        values,
      );
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: "Character not found" });
      }
      return result.rows[0];
    },
  );
};
