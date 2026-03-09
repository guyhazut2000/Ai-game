import type { FastifyPluginAsync } from "fastify";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-prod";

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: { username: string; password: string } }>(
    "/register",
    {
      schema: {
        body: {
          type: "object",
          required: ["username", "password"],
          properties: {
            username: { type: "string", minLength: 3, maxLength: 50 },
            password: { type: "string", minLength: 6 },
          },
        },
      },
    },
    async (req, reply) => {
      const { username, password } = req.body;
      const hash = await bcrypt.hash(password, 10);
      try {
        const result = await pool.query(
          "INSERT INTO accounts (username, password_hash) VALUES ($1, $2) RETURNING id",
          [username, hash],
        );
        return reply.code(201).send({ accountId: result.rows[0].id });
      } catch (err: any) {
        if (err.code === "23505") {
          return reply.code(409).send({ error: "Username already taken" });
        }
        throw err;
      }
    },
  );

  app.post<{ Body: { username: string; password: string } }>(
    "/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["username", "password"],
          properties: {
            username: { type: "string" },
            password: { type: "string" },
          },
        },
      },
    },
    async (req, reply) => {
      const { username, password } = req.body;
      const result = await pool.query(
        "SELECT id, password_hash FROM accounts WHERE username = $1",
        [username],
      );
      if (result.rows.length === 0) {
        return reply.code(401).send({ error: "Invalid credentials" });
      }
      const account = result.rows[0] as { id: string; password_hash: string };
      const valid = await bcrypt.compare(password, account.password_hash);
      if (!valid) {
        return reply.code(401).send({ error: "Invalid credentials" });
      }
      const token = jwt.sign({ accountId: account.id, username }, JWT_SECRET, {
        expiresIn: "7d",
      });
      return { token, accountId: account.id };
    },
  );
};
