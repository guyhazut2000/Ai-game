import Fastify from "fastify";
import { WebSocketServer } from "ws";
import { handleConnection } from "./ws/handler.js";
import { tickMonsterAI } from "./game/combat.js";

const port = Number(process.env.PORT) || 3000;
const AUTH_SERVICE = process.env.AUTH_SERVICE_URL ?? "http://localhost:3001";
const PLAYER_SERVICE = process.env.PLAYER_SERVICE_URL ?? "http://localhost:3002";

const app = Fastify({ logger: true });

// ---- Health ----
app.get("/health", async () => ({ status: "ok" }));

// ---- Generic proxy helper ----
async function proxy(
  upstream: string,
  req: { method: string; url: string; body: unknown; headers: Record<string, string | string[] | undefined> },
  reply: { code: (n: number) => { send: (b: unknown) => unknown } },
) {
  try {
    const response = await fetch(upstream, {
      method: req.method,
      headers: {
        "content-type": "application/json",
        ...(req.headers.authorization ? { authorization: req.headers.authorization as string } : {}),
      },
      body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
    });
    const text = await response.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = { error: text };
    }
    return reply.code(response.status).send(body);
  } catch (err: any) {
    app.log.error({ err, upstream }, "upstream unreachable");
    return reply.code(502).send({ error: `Service unavailable: ${err.message}` });
  }
}

// ---- Proxy: /auth/* → auth-service ----
app.all("/auth/*", async (req, reply) => {
  const path = req.url.slice("/auth".length) || "/";
  return proxy(`${AUTH_SERVICE}${path}`, req as any, reply as any);
});

// ---- Proxy: /player/* → player-service ----
app.all("/player/*", async (req, reply) => {
  const path = req.url.slice("/player".length) || "/";
  return proxy(`${PLAYER_SERVICE}${path}`, req as any, reply as any);
});

// ---- Start HTTP server then attach WebSocket ----
await app.listen({ port, host: "0.0.0.0" });

const wss = new WebSocketServer({ server: app.server });
wss.on("connection", handleConnection);

// Monster AI tick every 3 seconds
setInterval(tickMonsterAI, 3000);

app.log.info(`Gateway running on port ${port}`);
