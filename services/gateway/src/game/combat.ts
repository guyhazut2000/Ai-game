import { world } from "./world.js";
import { rollDrop } from "./monsters.js";
import { ATTACK_RANGE } from "shared";
const XP_PER_LEVEL = (level: number) => level * 100;

function calcDamage(atk: number, def: number): number {
  const variance = Math.floor(Math.random() * 5) - 2; // -2 to +2
  return Math.max(1, atk - def + variance);
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

export function handleAttack(characterId: string, monsterId: string): void {
  const player = world.players.get(characterId);
  const monster = world.monsters.get(monsterId);
  if (!player || !monster) return;

  if (distance(player.x, player.y, monster.x, monster.y) > ATTACK_RANGE) {
    world.send(characterId, { type: "error", message: "Too far away" });
    return;
  }

  // Player hits monster
  const dmg = calcDamage(player.atk, monster.def);
  monster.hp = Math.max(0, monster.hp - dmg);

  world.broadcast({ type: "combat_result", damage: dmg, monsterId, monsterHp: monster.hp, attackerId: characterId });

  if (monster.hp <= 0) {
    world.monsters.delete(monsterId);
    const drop = rollDrop(monster.type);
    world.broadcast({ type: "monster_died", monsterId, drop });

    // Grant XP
    const gained = monster.xpReward;
    player.xp += gained;
    let leveled = false;
    while (player.xp >= XP_PER_LEVEL(player.level)) {
      player.xp -= XP_PER_LEVEL(player.level);
      player.level += 1;
      player.maxHp = Math.floor(player.maxHp * 1.1);
      player.hp = player.maxHp; // heal on level up
      player.atk = Math.floor(player.atk * 1.05);
      player.def = Math.floor(player.def * 1.05);
      leveled = true;
    }
    world.broadcast({
      type: "xp_gained",
      characterId,
      xp: gained,
      totalXp: player.xp,
      level: player.level,
    });

    if (leveled) {
      // Announce updated world state so HP bars refresh
      world.broadcast({ type: "world_state", players: world.getPlayerSummaries(), monsters: [...world.monsters.values()] });
    }

    world.scheduleRespawn(monster);
    return;
  }

  // Monster retaliates immediately
  const monsterDmg = calcDamage(monster.atk, player.def);
  player.hp = Math.max(0, player.hp - monsterDmg);
  world.broadcast({ type: "monster_attacked_player", characterId, damage: monsterDmg, playerHp: player.hp });
}

/** Called on a tick to make monsters attack nearby players */
export function tickMonsterAI(): void {
  for (const monster of world.monsters.values()) {
    let closest: { dist: number; id: string } | null = null;
    for (const [cid, p] of world.players) {
      const d = distance(monster.x, monster.y, p.x, p.y);
      if (d <= ATTACK_RANGE && (!closest || d < closest.dist)) {
        closest = { dist: d, id: cid };
      }
    }
    if (!closest) continue;
    const player = world.players.get(closest.id)!;
    const dmg = calcDamage(monster.atk, player.def);
    player.hp = Math.max(0, player.hp - dmg);
    world.send(closest.id, { type: "monster_attacked_player", characterId: closest.id, damage: dmg, playerHp: player.hp });
  }
}
