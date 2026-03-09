# Plan: Phase 1 — Core Loop

## Goal

Deliver a working single-player-feel game loop: login → create/select character → move in the world → attack monsters → receive XP/loot. All services communicate over HTTP/WebSocket through the gateway.

## Tasks

### Auth Service
- [x] Scaffold `services/auth-service` (Fastify + TypeScript)
- [x] PostgreSQL schema: `accounts` table (id, username, password_hash)
- [x] `POST /register` — create account (hash password with bcrypt)
- [x] `POST /login` — validate credentials, return JWT
- [x] JWT middleware utility in `shared`

### Player Service
- [x] Scaffold `services/player-service` (Fastify + TypeScript)
- [x] PostgreSQL schema: `characters` table (id, account_id, name, class, level, xp, hp, mp, x, y)
- [x] `POST /characters` — create character (name, class; max 5 per account)
- [x] `GET /characters` — list characters for account
- [x] `GET /characters/:id` — get single character

### Gateway routing
- [x] Add auth and player service proxy routes to gateway (`/auth/*`, `/player/*`)
- [x] WebSocket server in gateway: accept connections, broadcast game events

### Game Service (in-process with gateway for Phase 1)
- [x] In-memory world state: player positions map (characterId → {x, y})
- [x] WebSocket message: `move` — validate and update position, broadcast to all players
- [x] Spawn static monsters in world (2–3 types, fixed positions, respawn timer)

### Combat
- [x] WebSocket message: `attack` — player attacks monster in range
- [x] Damage formula: `max(1, attacker.atk - defender.def)` with RNG variance
- [x] Monster retaliates (simple tick loop server-side)
- [x] On monster death: grant XP to attacker, roll loot drop
- [x] `PlayerLevelUp` when XP threshold reached (update character stats)

### Client UI
- [x] Login / Register screen (React, calls gateway `/auth/*`)
- [x] Character selection screen (list characters, create new)
- [x] 3D game scene: render player avatar (box mesh) and other players
- [x] WASD / arrow-key movement (send `move` via WebSocket)
- [x] Render monsters in scene; click to attack (send `attack` via WebSocket)
- [x] HUD: HP bar, XP bar, level indicator

### Infrastructure
- [x] Add PostgreSQL and Redis to `docker-compose.yml`
- [x] `.env.example` for auth-service and player-service
- [x] Database migration script (or Drizzle/Prisma minimal setup)

## Acceptance

- Can register, login, create a character, enter the world.
- WASD moves the character; position syncs to server.
- Attacking a monster reduces its HP; death grants XP; XP triggers level-up.
- Multiple browser tabs see each other's movements.
