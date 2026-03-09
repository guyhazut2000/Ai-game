import type { WebSocket } from "ws";
import type { IncomingMessage } from "http";
import jwt from "jsonwebtoken";
import type { JwtPayload, ClientMessage } from "shared";
import { world, type PlayerState } from "../game/world.js";
import { handleAttack } from "../game/combat.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-prod";
const PLAYER_SERVICE = process.env.PLAYER_SERVICE_URL ?? "http://localhost:3002";

async function loadCharacter(token: string, characterId: string): Promise<PlayerState | null> {
  try {
    const res = await fetch(`${PLAYER_SERVICE}/characters/${characterId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const char = (await res.json()) as any;
    return {
      characterId: char.id,
      accountId: char.account_id,
      name: char.name,
      x: char.x ?? 0,
      y: char.y ?? 0,
      hp: char.hp,
      maxHp: char.max_hp,
      atk: char.atk,
      def: char.def,
      level: char.level,
      xp: char.xp,
      ws: null as any, // assigned after
    };
  } catch {
    return null;
  }
}

async function saveCharacter(state: PlayerState, token: string): Promise<void> {
  try {
    await fetch(`${PLAYER_SERVICE}/characters/${state.characterId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ hp: state.hp, xp: state.xp, level: state.level, x: state.x, y: state.y }),
    });
  } catch {
    // best-effort save
  }
}

export async function handleConnection(ws: WebSocket, req: IncomingMessage): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const token = url.searchParams.get("token");
  const characterId = url.searchParams.get("characterId");

  if (!token || !characterId) {
    ws.send(JSON.stringify({ type: "error", message: "Missing token or characterId" }));
    ws.close();
    return;
  }

  // Verify JWT
  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    ws.send(JSON.stringify({ type: "error", message: "Invalid token" }));
    ws.close();
    return;
  }

  // Load character from player-service
  const state = await loadCharacter(token, characterId);
  if (!state || state.accountId !== payload.accountId) {
    ws.send(JSON.stringify({ type: "error", message: "Character not found" }));
    ws.close();
    return;
  }
  state.ws = ws;

  world.addPlayer(state);

  // Send current world state to the joining player
  ws.send(
    JSON.stringify({
      type: "world_state",
      players: world.getPlayerSummaries(),
      monsters: [...world.monsters.values()],
    }),
  );

  // Notify others that this player joined
  world.broadcast(
    { type: "player_joined", characterId: state.characterId, name: state.name, x: state.x, y: state.y },
    state.characterId,
  );

  ws.on("message", (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString()) as ClientMessage;
    } catch {
      return;
    }

    if (msg.type === "move") {
      state.x = msg.x;
      state.y = msg.y;
      world.broadcast(
        { type: "player_moved", characterId: state.characterId, x: state.x, y: state.y },
        state.characterId,
      );
    } else if (msg.type === "attack") {
      handleAttack(state.characterId, msg.monsterId);
    }
  });

  ws.on("close", () => {
    world.removePlayer(state.characterId);
    world.broadcast({ type: "player_left", characterId: state.characterId });
    saveCharacter(state, token);
  });
}
