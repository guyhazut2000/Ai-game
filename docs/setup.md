# Project setup

How to get the repository and development environment ready. For **workflow** (branches, PRs, changelog), see [workflow.md](workflow.md).

## Clone and install

1. Clone the repository.
2. Install dependencies per workspace layout (see [PROJECT_ARCHITECTURE.md](../PROJECT_ARCHITECTURE.md) Section 7): e.g. `npm install` in `client/`, and in each service under `services/` as needed.
3. Use Docker Compose for PostgreSQL, Redis, and message broker (see below).

## Docker

- **Dev infrastructure only (recommended for daily dev):** Start Postgres and Redis in the background; run client and gateway locally for fast reload.
  ```bash
  npm run docker:infra
  npm run dev:client    # in another terminal
  npm run dev:gateway   # optional
  ```
- **Full app in Docker (optional):** Build and run gateway + Postgres + Redis with `docker compose --profile app up --build`, or use `npm run docker:app`. The gateway is exposed on **port 3001** (to avoid conflict with local dev on 3000). The client is still best run locally (`npm run dev:client`) for hot reload; for production, use `docker/Dockerfile.client` to build and serve the client with nginx.
- **Stop:** `npm run docker:down` or `docker compose down`.
- Copy `.env.example` to `.env` and set `DB_URL`, `REDIS_URL` if services need them.

## Agent skills (Vercel / skills.sh)

This project uses the [skills.sh](https://skills.sh) ecosystem for AI agent skills (e.g. React best practices). Install **once per clone** or when adding new skills:

```bash
npx skills add vercel-labs/agent-skills
```

- When prompted, choose **project** (not global) so skills live in the repo and are shared with the team.
- If Cursor shows skills as "Rules" instead of "Skills", try reinstalling with **Copy** instead of Symlink.

To install only specific skills:

```bash
npx skills add vercel-labs/agent-skills --list
npx skills add vercel-labs/agent-skills --skill react-best-practices
```

After installation, commit any new or updated files under `.cursor/` and `.agents/` (Vercel skills install to `.agents/skills/`) so everyone has the same skills. Full details: [workflow.md](workflow.md) Section 6.
