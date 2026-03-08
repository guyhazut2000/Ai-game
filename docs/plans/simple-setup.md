# Plan: Simple setup

## Goal

Bootstrap the mono-repo with the folder structure from PROJECT_ARCHITECTURE.md, a runnable React + Three.js client, and a minimal gateway so the project is ready for Phase 1 (login, character, move, combat).

## Tasks

- [x] Create mono-repo folder structure and root package.json (client, services/gateway, shared, docker)
- [x] Bootstrap client: React + TypeScript + Vite + React Three Fiber, runnable blank 3D scene
- [x] Add minimal gateway: Node + TypeScript (Fastify), health GET endpoint
- [ ] Add shared package: minimal TypeScript types and export
- [ ] Update PROJECT_ARCHITECTURE Section 13 or CHANGELOG when done

## Acceptance

- From repo root, `npm install` and `npm run dev` (or equivalent) starts the client; gateway responds to GET /health. Structure matches PROJECT_ARCHITECTURE.md Section 7.
