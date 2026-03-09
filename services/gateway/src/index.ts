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

// ---- Proxy: /auth/* → auth-service ----
app.all<{ Params: { "*": string } }>("/auth/*", async (req, reply) => {
  const path = req.url.replace("/auth", "");
  const url = `${AUTH_SERVICE}${path}`;
  const upstream = await fetch(url, {
    method: req.method,
    headers: { "content-type": "application/json" },
    body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
  });
  const body = await upstream.json();
  return reply.code(upstream.status).send(body);
});

// ---- Proxy: /player/* → player-service ----
app.all<{ Params: { "*": string } }>("/player/*", async (req, reply) => {
  const path = req.url.replace("/player", "");
  const url = `${PLAYER_SERVICE}${path}`;
  const upstream = await fetch(url, {
    method: req.method,
    headers: {
      "content-type": "application/json",
      ...(req.headers.authorization ? { authorization: req.headers.authorization } : {}),
    },
    body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
  });
  const body = await upstream.json();
  return reply.code(upstream.status).send(body);
});

// ---- Start HTTP server then attach WebSocket ----
await app.listen({ port, host: "0.0.0.0" });

const wss = new WebSocketServer({ server: app.server });
wss.on("connection", handleConnection);

// Monster AI tick every 3 seconds
setInterval(tickMonsterAI, 3000);

app.log.info(`Gateway running on port ${port}`);
