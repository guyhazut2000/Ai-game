import jwt from "jsonwebtoken";
import type { FastifyRequest, FastifyReply } from "fastify";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-prod";

export interface AuthPayload {
  accountId: string;
  username: string;
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    await reply.code(401).send({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as AuthPayload;
    (req as any).account = payload;
  } catch {
    await reply.code(401).send({ error: "Invalid token" });
  }
}
