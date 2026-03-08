# Ai-game

Browser-based multiplayer online RPG (Silkroad-inspired) — learning project for AI systems, microservices, and game architecture.

## Documentation

- **[PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)** — Architecture, tech stack, repo layout, versioning, and changelog.
- **[docs/workflow.md](docs/workflow.md)** — Development workflow: branches, PRs, plans and tasks, and documenting changes.
- **[docs/plans/](docs/plans/)** — Feature plans and task lists (use `/create-plan`, `/start-task`, `/complete-task`).
- **[docs/setup.md](docs/setup.md)** — Clone, install, and agent skills (Vercel skills.sh).

## Quick setup

1. Clone the repo and install dependencies (see docs/setup.md).
2. (Optional) Install Vercel agent skills: `npx skills add vercel-labs/agent-skills` — choose **project** and commit any new `.cursor/` and `.agents/` files.

## Cursor / Claude

- **Rules and commands:** See `.cursor/rules/` and `.cursor/commands/`. Commands follow docs/workflow.md.
- **Claude Code:** Project config is in `.claude/CLAUDE.md`; it points to docs/workflow.md and PROJECT_ARCHITECTURE.md.
