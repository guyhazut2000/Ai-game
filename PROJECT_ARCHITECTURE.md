# Project Architecture

Multiplayer Online RPG — Architecture and Design Document

---

## 1. Project Overview

### Game Concept

This project is a **browser-based multiplayer online RPG** inspired by Silkroad Online. Players inhabit a shared online world where they can fight monsters, level up, acquire loot, and interact with other players.

**Core features:**

- **Multiplayer RPG:** Persistent online world with real-time interaction.
- **Character classes:** Players choose from Warrior, Archer, or Magician, each with distinct playstyles and abilities.
- **Combat:** Fight monsters in the world; monsters fight back. Combat is real-time with damage calculation and progression.
- **Progression:** Gain experience (XP) and level up to unlock stats and capabilities.
- **Loot:** Defeated monsters drop items; players collect and manage inventory and equipment.
- **Online world:** Multiple players share the same world, see each other, and can cooperate or compete.
- **Account model:** Up to **5 characters per account**; players switch between characters from the character selection screen.

### Project Goal

This project is **primarily for learning and demonstration**. It is designed to explore and showcase:

- **AI systems** — Monster AI, NPC dialogue, optional player bots, anti-cheat signals.
- **Microservices architecture** — Decoupled services, event-driven design, scalable backend.
- **Online multiplayer game infrastructure** — WebSockets, real-time state, session management.
- **Observability and monitoring** — Logging, metrics, tracing across services.
- **Scalable backend design** — Databases, caches, message queues, and deployment patterns.

The codebase and this document serve as a blueprint for building and understanding a production-style game backend and client architecture.

---

## 2. High-Level Architecture

The system is built around a **client–gateway–services** model: the browser client connects to a WebSocket/HTTP gateway, which routes traffic to backend microservices.

### Architecture Diagram

```
+------------------+
|  Client (Browser)|
|  React + Three.js|
|  TypeScript      |
+--------+---------+
         |
         | HTTP / WebSocket
         v
+------------------+
|  WebSocket       |
|  API Gateway     |
+--------+---------+
         |
         | route / forward
         v
+------------------------------------------------------------------+
|                     Backend Services                              |
|  +-------------+  +-------------+  +-------------+  +-----------+ |
|  | Auth        |  | Player      |  | Game        |  | Combat    | |
|  | Service     |  | Service     |  | Service     |  | Engine    | |
|  +-------------+  +-------------+  +-------------+  +-----------+ |
|  +-------------+  +-------------+                                 |
|  | Chat        |  | AI          |                                 |
|  | Service     |  | Service     |                                 |
|  +-------------+  +-------------+                                 |
+------------------------------------------------------------------+
         |
         v
+------------------+  +------------------+
|  PostgreSQL      |  |  Redis           |
|  (persistent)    |  |  (state/cache)   |
+------------------+  +------------------+
         |
         v
+------------------+
|  Kafka/RabbitMQ  |
|  (events)        |
+------------------+
```

### Service Responsibilities

| Service | Responsibility |
|---------|----------------|
| **API Gateway** | HTTP and WebSocket entry point; routing, rate limiting, TLS termination; forwards requests to the appropriate service. |
| **Auth Service** | Login, logout, session management; JWT or token issuance; account and character ownership validation. |
| **Player Service** | Character CRUD; stats (STR, DEX, INT, HP, MP); equipment; leveling and XP; persistence in PostgreSQL. |
| **Game Service** | World state; player and monster positions; movement; zones; game loop coordination; real-time updates via Redis/WS. |
| **Combat Engine** | Damage calculation; skills and targeting; combat resolution; integration with Player and Game services. |
| **Chat Service** | Global and party channels; whispers; guild chat (when guilds exist); message persistence and moderation hooks. |
| **AI Service** | Monster AI (pathfinding, behavior); optional player bot logic; NPC dialogue; anti-cheat analysis; implemented in Python (FastAPI). |

---

## 3. Technology Stack

A modern, type-safe stack is used across frontend, backend, AI, data, and DevOps.

### Frontend

- **React** — UI components and application state.
- **Three.js** — 3D rendering (world, characters, monsters). Integration with React via **React Three Fiber** (R3F) where applicable.
- **TypeScript** — Typing across the client codebase.
- **WebSockets** — Real-time communication with the gateway (movement, combat, chat).

### Backend

- **Node.js** — Runtime for gateway and game-related services.
- **TypeScript** — Shared typing and consistency with the client.
- **Fastify or Express** — HTTP API and REST endpoints.
- **WebSocket server** — e.g. `ws` or `uWebSockets.js` for low-latency game and chat traffic.

### AI Services

- **Python** — Primary language for AI and ML components.
- **FastAPI** — HTTP/gRPC API for the AI service.
- **PyTorch** (optional) — For custom models (e.g. anti-cheat, NPC behavior) if needed.

### Databases

- **PostgreSQL** — Persistent data: accounts, characters, inventory, items, chat history, etc.
- **Redis** — Real-time state (positions, sessions), caching, pub/sub for live updates.

### Messaging

- **Kafka or RabbitMQ** — Event bus for domain events (e.g. `MonsterKilled`, `PlayerLevelUp`); async processing and service decoupling.

### DevOps

- **Docker** — Containerized services and client build.
- **Docker Compose** — Local and single-host orchestration.
- **Kubernetes** — Future target for multi-node deployment and scaling.

### Monitoring

- **Prometheus** — Metrics collection (latency, throughput, game KPIs).
- **Grafana** — Dashboards and alerting.
- **OpenTelemetry** — Distributed tracing and instrumentation.
- **ELK stack** (Elasticsearch, Logstash, Kibana) — Log aggregation, search, and analysis.

---

## 4. Game System Design

### Player System

- **Characters:** Up to 5 per account; each has class (Warrior, Archer, Magician), name, and level.
- **Stats:** Primary attributes (e.g. STR, DEX, INT) and derived values (HP, MP, attack, defense). Stats can scale with level and equipment.
- **Equipment:** Slots for weapon, armor, and accessories; equipment modifies stats and appearance.
- **Leveling:** XP gained from killing monsters (and later quests); level thresholds define when a character levels up and receives stat increases or skill points.

### Combat System

- **Flow:** Player initiates attack on a monster (or is targeted by a monster). Combat engine resolves damage and updates HP.
- **Damage calculation:** Formula based on attacker stats, defender stats, and skill/weapon (e.g. base damage + stat scaling − defense).
- **Monster retaliation:** Monsters can attack the player when in range or when aggroed; same damage model used for consistency.
- **Action model:** Real-time with cooldowns or turn-like ticks depending on design choice; combat service authoritatively resolves outcomes.

### Monster System

- **Spawn system:** Monsters spawn in defined zones or at spawn points; respawn after a delay when killed.
- **Monster behavior:** States such as idle, chase (pathfinding to target), and attack; behavior logic can be extended by the AI service (pathfinding, target selection).

### Inventory System

- **Item drops:** Killing monsters yields item drops (probability tables per monster type); items are generated and assigned to the player.
- **Inventory:** Fixed or expandable slots; items can be stacked where applicable (e.g. consumables).
- **Equipment slots:** Equippable items (weapon, armor, etc.) are placed in dedicated slots and affect character stats and possibly appearance.

---

## 5. AI Systems

AI is used for monsters, optional player bots, NPCs, and anti-cheat. AI components run in the **AI Service** (Python/FastAPI) and communicate with the game server via REST, gRPC, or events.

### Monster AI

- **Pathfinding:** Grid-based or navmesh-based pathfinding so monsters can chase players or move around obstacles.
- **Target selection:** Choose target (e.g. nearest player, highest threat); can be rule-based or score-based.
- **Combat behavior:** Decide when to attack, use skills, or flee based on HP and context; behavior runs server-side or with signals from the AI service.

### Player Bot (Configurable)

- **Purpose:** Learning and testing; configurable “farming” bot that automates repetitive actions.
- **Behavior:** Auto move to areas, auto attack monsters, auto use potions when HP/MP low; configurable via rules or simple scripts.
- **Placement:** Can run as a dedicated client or as a server-side bot character; clearly documented as for learning and testing, not for unfair advantage in production.

### NPC AI

- **Dynamic NPC dialogue:** NPCs respond to player input using rule-based scripts or LLM-backed dialogue (with appropriate guards and cost controls).
- **AI quest systems:** Quest text generation or quest validation assisted by AI; e.g. generating objectives or checking completion conditions.

### Anti-Cheat AI

- **Goal:** Detect bot-like or automated player behavior.
- **Signals:** Movement patterns, action timing, input regularity; AI service produces risk scores or flags.
- **Enforcement:** Game server or a dedicated service consumes these signals and can throttle, flag, or ban accounts according to policy.

### Integration

- AI services are implemented in **Python** (FastAPI) and expose REST or gRPC endpoints.
- Game server (Node.js) calls the AI service for pathfinding, behavior decisions, or anti-cheat analysis as needed.
- Events (e.g. combat start/end, movement samples) can be sent to the AI service via the message bus for async analysis.

---

## 6. Microservices Design

### Communication Patterns

- **REST:** CRUD operations, login, character creation, admin tools; simple and widely supported.
- **gRPC:** Low-latency, high-throughput calls between game server and AI service or between internal services where strong typing and performance matter.
- **Event-driven:** Domain events published to Kafka or RabbitMQ; services subscribe and react asynchronously (e.g. update leaderboards, grant achievements, persist loot).

### Example Domain Events

| Event | Producer | Typical Consumers | Purpose |
|-------|----------|-------------------|---------|
| `PlayerJoined` | Game Service | Chat, Analytics | Player entered world or zone. |
| `MonsterKilled` | Combat Engine | Player Service, Game Service | Grant XP, roll loot, update spawn. |
| `ItemDropped` | Player Service / Combat | Player Service, Game Service | Add item to inventory or ground. |
| `PlayerLevelUp` | Player Service | Chat, Analytics, Game Service | Notify, update stats, unlock content. |
| `CombatStarted` | Combat Engine | AI Service, Analytics | Log combat, feed anti-cheat. |
| `ChatMessage` | Chat Service | Moderation, Analytics | Persist, filter, log. |

### Event Flow Example: Player Kills Monster

```
Player attacks monster
        |
        v
+------------------+
|  Game Service    |  (validates target, position)
+--------+---------+
         |
         v
+------------------+
|  Combat Engine   |  (resolves damage, HP to 0)
+--------+---------+
         |
         | publish MonsterKilled(monsterId, playerId, zoneId)
         v
+------------------+
|  Kafka/RabbitMQ  |
+--------+---------+
         |
    +----+----+
    v         v
+--------+  +--------------+
| Player |  | Game Service |
| Service|  | (respawn     |
| (XP,   |  |  timer)      |
| loot)  |  +--------------+
+--------+
```

---

## 7. Repository Structure

Recommended **mono-repo** layout:

```
/game-project
  /client              # React + Three.js (e.g. React Three Fiber) + TypeScript frontend
  /services
    /gateway           # API Gateway + WebSocket server
    /auth-service      # Authentication and sessions
    /player-service    # Characters, stats, equipment, leveling
    /game-service      # World state, movement, zones
    /combat-engine     # Combat resolution (or part of game-service)
    /chat-service      # Chat channels and messages
    /ai-service        # Python/FastAPI: monster AI, bots, NPC, anti-cheat
  /shared              # Shared types, constants, event schemas (client + services)
  /infrastructure      # Terraform, scripts (optional)
  /docker              # Dockerfiles, Docker Compose
  /kubernetes          # Kubernetes manifests (future)
  /docs                # Additional design docs, ADRs
```

### Folder Descriptions

- **client:** React application with Three.js (React Three Fiber) for 3D; TypeScript; WebSocket client for game and chat.
- **services/gateway:** Single entry point for HTTP and WebSocket; routes to auth, player, game, chat, etc.
- **services/auth-service:** Login, tokens, account–character association.
- **services/player-service:** Character lifecycle, stats, equipment, inventory, XP/leveling; uses PostgreSQL.
- **services/game-service:** World and zone state, positions, movement validation, spawns; uses Redis for real-time state.
- **services/combat-engine:** Damage and combat rules; can be a separate service or module within game-service.
- **services/chat-service:** Channels, messages, persistence; optional moderation hooks.
- **services/ai-service:** Python FastAPI service for all AI features; called by game/combat services.
- **shared:** TypeScript (or shared IDL) types, event payloads, constants used by client and Node services; keeps contracts in one place.
- **infrastructure:** Optional IaC and utility scripts.
- **docker:** Dockerfiles per service and `docker-compose.yml` for local runs.
- **kubernetes:** Manifests for future deployment.
- **docs:** Architecture decision records (ADRs), runbooks, and other documentation.

---

## 8. Development Workflow

### Git Workflow

- **Branches:** Feature branches from `main` or `develop`; short-lived branches for each feature or fix.
- **Integration:** Pull requests (PRs) with review; merge to `main` or `develop` after approval.
- **Releases:** Tags (e.g. `v1.0.0`) for releases; versioning scheme described in Section 13.

### Local Development

- **Docker Compose:** Run PostgreSQL, Redis, and the message broker (Kafka or RabbitMQ) via Compose; optionally run gateway and backend services in containers.
- **Client:** Run locally (e.g. `npm run dev` in `client/`) against local gateway; hot reload for fast iteration.
- **Services:** Run individually (e.g. `npm run dev` or `ts-node`) or via Compose; ensure ports and env vars are consistent.

### Environment Variables

- **Per-service:** Each service has an `.env.example` listing required variables (no secrets).
- **Common examples:** `DB_URL`, `REDIS_URL`, `JWT_SECRET`, `AI_SERVICE_URL`, `KAFKA_BROKERS` or `RABBITMQ_URL`, `PORT`.
- **Central list:** Maintain a single list in `docs` or README of all env vars used across the project.

### Service-to-Service Communication

- **Local:** Services reach each other via `localhost` and different ports (e.g. `PLAYER_SERVICE_URL=http://localhost:3002`).
- **Discovery:** No dynamic discovery in minimal setup; URLs and ports configured via environment variables.

---

## 9. Testing Strategy

### Unit Tests

- **Backend (Node/TypeScript):** Jest (or equivalent); focus on business logic, damage formulas, validation, and utilities.
- **AI (Python):** pytest; focus on pathfinding, behavior rules, and anti-cheat scoring logic.
- **Client:** Jest + React Testing Library for UI and game logic that does not depend on Three.js runtime; mock WebSocket and API.

### Integration Tests

- **APIs:** Test HTTP and WebSocket endpoints against a real or containerized PostgreSQL and Redis (e.g. Testcontainers).
- **Events:** Publish domain events and assert that consuming services update state or side effects correctly.

### Load Testing

- **Tools:** k6 or Locust.
- **Targets:** HTTP endpoints (login, character list) and WebSocket (movement, combat, chat) for throughput and latency under load.
- **Goals:** Establish baselines and catch regressions before release.

### Game Simulation Testing

- **Scripted scenarios:** Automated flows such as login → create character → move → attack monster → receive loot → level up.
- **Purpose:** Validate end-to-end behavior and critical paths across gateway and services.

---

## 10. Observability and Debugging

### Logging

- **Format:** Structured JSON logs with timestamp, level, service name, and message.
- **Correlation:** Use a correlation ID (or trace ID) on each request and propagate across services; include it in all log lines for that request.
- **Aggregation:** Ship logs to Elasticsearch (ELK) or Loki for search and dashboards; optional Logstash or Fluentd for processing.

### Metrics

- **Collection:** Prometheus scrapes HTTP metrics endpoints from each service.
- **Types:** Counters (requests, errors, kills), histograms (latency), gauges (active players, queue depth).
- **Dashboards:** Grafana dashboards per service and for game KPIs (e.g. concurrent players, combat events per second).

### Tracing

- **Instrumentation:** OpenTelemetry in gateway and all backend services; trace IDs generated at the gateway and propagated via headers or context.
- **Storage:** Export traces to Jaeger or similar; correlate with logs and metrics via trace ID.

### Debugging Distributed Systems

- **Trace ID:** Use the trace ID to follow a single request across gateway and services in logs and traces.
- **Log sampling:** In production, sample high-volume logs if needed; always log errors and critical events.
- **Replay:** Use stored events or recorded sessions to replay scenarios locally with the same inputs for debugging.

---

## 11. MVP Development Plan

The first version is delivered in four phases.

### Phase 1: Core Loop

- Login (account).
- Create character (name, class).
- Move character in the world (WASD or click).
- Attack monsters (target, basic attack, damage resolution).

Goal: Single-player feel with a working combat loop.

### Phase 2: Progression and Loot

- XP from killing monsters; level up and stat increases.
- Loot drops from monsters; item definitions and drop tables.
- Inventory: pick up, store, and view items.
- Equipment: equip items in slots and apply stat modifiers.

Goal: Meaningful progression and itemization.

### Phase 3: Multiplayer and Chat

- Multiple players visible in the same world; position sync via WebSocket.
- Chat: global channel and optionally party channel.
- Basic persistence of character state across sessions.

Goal: Real multiplayer and social interaction.

### Phase 4: AI

- **Monster AI:** Pathfinding and chase/attack behavior; optionally delegated to AI service.
- **Configurable player bot:** Auto farm, auto attack, auto potions; for learning and testing.

Goal: Demonstrate AI integration and scalable game AI patterns.

---

## 12. Future Improvements

Possible extensions beyond MVP:

- **PvP combat:** Dedicated zones or rules for player-vs-player; ranking or seasons.
- **Guilds:** Guild creation, membership, guild chat, guild storage or perks.
- **Quests:** Quest givers, objectives, rewards; scripted and optionally AI-generated.
- **World bosses:** High-HP shared targets requiring multiple players; special loot.
- **Procedural maps:** Generated or parameterized zones for variety.
- **AI-generated quests:** Use AI to generate quest text and objectives within guardrails.
- **Advanced monster AI:** Smarter tactics, skills, and group behavior via the AI service.

---

## 13. Versioning and Changelog

### Versioning Scheme

- **Scheme:** Semantic Versioning (`MAJOR.MINOR.PATCH`).
  - **MAJOR:** Incompatible API or game design changes.
  - **MINOR:** New features, backward-compatible.
  - **PATCH:** Bug fixes and small improvements, backward-compatible.
- **Where version is stored:**
  - Root `package.json` (if present) and/or per-service `package.json` for Node services.
  - Python AI service: `pyproject.toml` or `__version__` in package.
  - Git tags (e.g. `v1.0.0`) for releases.
  - Optional: root `VERSION` file or `docs/version.md` for a single source of truth.

Releases are tagged in the repo; deployment and CI can read version from tags or package files.

### Changelog

For each release, document what was **Added**, **Fixed**, and **Removed**. This can live in this section (below) or in a separate `CHANGELOG.md` in the repo root or under `docs/`. If maintained separately, link to it here.

**Example format:**

```
## [Unreleased]
- (nothing yet)

## [1.0.0] - YYYY-MM-DD
### Added
- Initial MVP: login, character creation, movement, combat.
- XP and leveling; loot and inventory; equipment slots.
- Multiplayer visibility and global chat.
- Monster AI (pathfinding, chase, attack) and optional farming bot.

### Fixed
- (none in initial release)

### Removed
- (none)
```

Going forward, each new version gets a similar block: **Added** (features, systems), **Fixed** (bugs), **Removed** (deprecated or removed features/APIs). This section (or `CHANGELOG.md`) is the single place to see “how we version” and “what changed per version.”

---

### Actual Changelog

## [Unreleased]

## [0.1.0] - 2026-03-09
### Added
- Mono-repo scaffold: `client/`, `services/gateway/`, `shared/`, `docker/`.
- Client: React + TypeScript + Vite + React Three Fiber; blank 3D scene.
- Gateway: Fastify with `GET /health` endpoint.
- Shared package: minimal TypeScript types and exports.
- Docker Compose with gateway service definition.

---

*This document is the architectural blueprint for the multiplayer online RPG project. Use it to align implementation, onboarding, and future design decisions.*
