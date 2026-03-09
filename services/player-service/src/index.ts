import Fastify from "fastify";
import { initDb } from "./db.js";
import { characterRoutes } from "./routes/characters.js";

const port = Number(process.env.PORT) || 3002;
const app = Fastify({ logger: true });

await initDb();
await app.register(characterRoutes);
app.get("/health", async () => ({ status: "ok" }));

try {
  await app.listen({ port, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
