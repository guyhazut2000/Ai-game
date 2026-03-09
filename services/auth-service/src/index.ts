import Fastify from "fastify";
import { initDb } from "./db.js";
import { authRoutes } from "./routes/auth.js";

const port = Number(process.env.PORT) || 3001;
const app = Fastify({ logger: true });

try {
  await initDb();
} catch (err) {
  app.log.error({ err }, "DB init failed — is Postgres running? (npm run docker:infra)");
  process.exit(1);
}
await app.register(authRoutes);
app.get("/health", async () => ({ status: "ok" }));

try {
  await app.listen({ port, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
