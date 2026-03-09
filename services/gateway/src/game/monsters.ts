import type { Monster, ItemDrop } from "shared";
import { randomUUID } from "crypto";

export interface MonsterTemplate {
  type: string;
  name: string;
  maxHp: number;
  atk: number;
  def: number;
  xpReward: number;
  drops: Array<{ weight: number; item: ItemDrop }>;
}

const TEMPLATES: MonsterTemplate[] = [
  {
    type: "slime",
    name: "Slime",
    maxHp: 30,
    atk: 3,
    def: 1,
    xpReward: 15,
    drops: [{ weight: 0.5, item: { name: "Slime Gel", type: "misc" } }],
  },
  {
    type: "goblin",
    name: "Goblin",
    maxHp: 60,
    atk: 7,
    def: 3,
    xpReward: 35,
    drops: [{ weight: 0.4, item: { name: "Rusty Dagger", type: "weapon" } }],
  },
  {
    type: "orc",
    name: "Orc",
    maxHp: 120,
    atk: 12,
    def: 6,
    xpReward: 80,
    drops: [{ weight: 0.3, item: { name: "Iron Shield Fragment", type: "armor" } }],
  },
];

/** Fixed spawn positions in the world */
const SPAWN_POINTS: Array<{ x: number; y: number; templateIndex: number }> = [
  { x: 5,  y: 0,  templateIndex: 0 },
  { x: -5, y: 2,  templateIndex: 0 },
  { x: 8,  y: -3, templateIndex: 1 },
  { x: -8, y: 4,  templateIndex: 1 },
  { x: 12, y: 0,  templateIndex: 2 },
  { x: 0,  y: 10, templateIndex: 1 },
  { x: -3, y: -8, templateIndex: 0 },
];

export function spawnAll(): Map<string, Monster> {
  const map = new Map<string, Monster>();
  for (const sp of SPAWN_POINTS) {
    const tpl = TEMPLATES[sp.templateIndex];
    const m: Monster = {
      id: randomUUID(),
      type: tpl.type,
      name: tpl.name,
      hp: tpl.maxHp,
      maxHp: tpl.maxHp,
      x: sp.x,
      y: sp.y,
      atk: tpl.atk,
      def: tpl.def,
      xpReward: tpl.xpReward,
    };
    map.set(m.id, m);
  }
  return map;
}

export function rollDrop(monsterType: string): ItemDrop | undefined {
  const tpl = TEMPLATES.find((t) => t.type === monsterType);
  if (!tpl) return undefined;
  for (const { weight, item } of tpl.drops) {
    if (Math.random() < weight) return item;
  }
  return undefined;
}

export function getTemplate(type: string): MonsterTemplate | undefined {
  return TEMPLATES.find((t) => t.type === type);
}
