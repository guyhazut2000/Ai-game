/**
 * Shared types and constants for client and services.
 */
export const APP_NAME = "ai-game";

export type CharacterClass = "warrior" | "archer" | "magician";

export interface Character {
  id: string;
  account_id: string;
  name: string;
  class: CharacterClass;
  level: number;
  xp: number;
  hp: number;
  max_hp: number;
  mp: number;
  max_mp: number;
  atk: number;
  def: number;
  x: number;
  y: number;
}

export interface JwtPayload {
  accountId: string;
  username: string;
}

export interface Monster {
  id: string;
  type: string;
  name: string;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  atk: number;
  def: number;
  xpReward: number;
}

export interface ItemDrop {
  name: string;
  type: "weapon" | "armor" | "consumable" | "misc";
}

// ---- WebSocket message types (client → server) ----
export type ClientMessage =
  | { type: "move"; x: number; y: number }
  | { type: "attack"; monsterId: string };

// ---- WebSocket message types (server → client) ----
export type ServerMessage =
  | {
      type: "world_state";
      players: Record<string, { x: number; y: number; name: string; hp: number; maxHp: number }>;
      monsters: Monster[];
    }
  | { type: "player_joined"; characterId: string; name: string; x: number; y: number }
  | { type: "player_left"; characterId: string }
  | { type: "player_moved"; characterId: string; x: number; y: number }
  | { type: "combat_result"; damage: number; monsterId: string; monsterHp: number; attackerId: string }
  | { type: "monster_attacked_player"; characterId: string; damage: number; playerHp: number }
  | { type: "monster_died"; monsterId: string; drop?: ItemDrop }
  | { type: "xp_gained"; characterId: string; xp: number; totalXp: number; level: number }
  | { type: "error"; message: string };
