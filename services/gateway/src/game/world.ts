import { randomUUID } from "crypto";
import type { Monster } from "shared";
import type { WebSocket } from "ws";
import { spawnAll } from "./monsters.js";

export interface PlayerState {
  characterId: string;
  accountId: string;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  level: number;
  xp: number;
  ws: WebSocket;
}

class World {
  players = new Map<string, PlayerState>();
  monsters = spawnAll();

  addPlayer(state: PlayerState): void {
    this.players.set(state.characterId, state);
  }

  removePlayer(characterId: string): void {
    this.players.delete(characterId);
  }

  /** Respawn a monster at its original position after a delay */
  scheduleRespawn(monster: Monster, delayMs = 8000): void {
    const { x, y, type, name, maxHp, atk, def, xpReward } = monster;
    setTimeout(() => {
      const newMonster: Monster = {
        id: randomUUID(),
        type,
        name,
        hp: maxHp,
        maxHp,
        x,
        y,
        atk,
        def,
        xpReward,
      };
      this.monsters.set(newMonster.id, newMonster);
      this.broadcast({ type: "world_state", players: this.getPlayerSummaries(), monsters: [...this.monsters.values()] });
    }, delayMs);
  }

  getPlayerSummaries(): Record<string, { x: number; y: number; name: string; hp: number; maxHp: number }> {
    const out: Record<string, { x: number; y: number; name: string; hp: number; maxHp: number }> = {};
    for (const [id, p] of this.players) {
      out[id] = { x: p.x, y: p.y, name: p.name, hp: p.hp, maxHp: p.maxHp };
    }
    return out;
  }

  broadcast(msg: object, exclude?: string): void {
    const data = JSON.stringify(msg);
    for (const [id, player] of this.players) {
      if (id !== exclude && player.ws.readyState === 1 /* OPEN */) {
        player.ws.send(data);
      }
    }
  }

  send(characterId: string, msg: object): void {
    const player = this.players.get(characterId);
    if (player?.ws.readyState === 1) {
      player.ws.send(JSON.stringify(msg));
    }
  }
}

export const world = new World();
