# Plan: Phase 1 — Core Loop

## Goal

Deliver a working single-player-feel game loop: login → create/select character → move in the world → attack monsters → receive XP/loot. All services communicate over HTTP/WebSocket through the gateway.

## Tasks

### Auth Service
- [ ] Scaffold `services/auth-service` (Fastify + TypeScript)
- [ ] PostgreSQL schema: `accounts` table (id, username, password_hash)
- [ ] `POST /register` — create account (hash password with bcrypt)
- [ ] `POST /login` — validate credentials, return JWT
- [ ] JWT middleware utility in `shared`

### Player Service
- [ ] Scaffold `services/player-service` (Fastify + TypeScript)
- [ ] PostgreSQL schema: `characters` table (id, account_id, name, class, level, xp, hp, mp, x, y)
- [ ] `POST /characters` — create character (name, class; max 5 per account)
- [ ] `GET /characters` — list characters for account
- [ ] `GET /characters/:id` — get single character

### Gateway routing
- [ ] Add auth and player service proxy routes to gateway (`/auth/*`, `/player/*`)
- [ ] WebSocket server in gateway: accept connections, broadcast game events

### Game Service (in-process with gateway for Phase 1)
- [ ] In-memory world state: player positions map (characterId → {x, y})
- [ ] WebSocket message: `move` — validate and update position, broadcast to all players
- [ ] Spawn static monsters in world (2–3 types, fixed positions, respawn timer)

### Combat
- [ ] WebSocket message: `attack` — player attacks monster in range
- [ ] Damage formula: `max(1, attacker.atk - defender.def)` with RNG variance
- [ ] Monster retaliates (simple tick loop server-side)
- [ ] On monster death: grant XP to attacker, roll loot drop
- [ ] `PlayerLevelUp` when XP threshold reached (update character stats)

### Client UI
- [ ] Login / Register screen (React, calls gateway `/auth/*`)
- [ ] Character selection screen (list characters, create new)
- [ ] 3D game scene: render player avatar (box mesh) and other players
- [ ] WASD / arrow-key movement (send `move` via WebSocket)
- [ ] Render monsters in scene; click to attack (send `attack` via WebSocket)
- [ ] HUD: HP bar, XP bar, level indicator

### Infrastructure
- [ ] Add PostgreSQL and Redis to `docker-compose.yml`
- [ ] `.env.example` for auth-service and player-service
- [ ] Database migration script (or Drizzle/Prisma minimal setup)

## Acceptance

- Can register, login, create a character, enter the world.
- WASD moves the character; position syncs to server.
- Attacking a monster reduces its HP; death grants XP; XP triggers level-up.
- Multiple browser tabs see each other's movements.
