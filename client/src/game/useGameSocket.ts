import { useEffect, useRef, useState, useCallback } from "react";
import type { Monster, ServerMessage, ClientMessage } from "shared";

export interface RemotePlayer {
  characterId: string;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
}

export interface GameState {
  players: Map<string, RemotePlayer>;
  monsters: Map<string, Monster>;
  localHp: number;
  localMaxHp: number;
  localLevel: number;
  localXp: number;
  xpToNext: number;
  connected: boolean;
}

interface Options {
  token: string;
  characterId: string;
  initialHp: number;
  initialMaxHp: number;
  initialLevel: number;
  initialXp: number;
}

export function useGameSocket(opts: Options) {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<GameState>({
    players: new Map(),
    monsters: new Map(),
    localHp: opts.initialHp,
    localMaxHp: opts.initialMaxHp,
    localLevel: opts.initialLevel,
    localXp: opts.initialXp,
    xpToNext: opts.initialLevel * 100,
    connected: false,
  });

  useEffect(() => {
    const wsUrl = `ws://localhost:3000/ws?token=${encodeURIComponent(opts.token)}&characterId=${opts.characterId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setState((s) => ({ ...s, connected: true }));
    ws.onclose = () => setState((s) => ({ ...s, connected: false }));

    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data as string) as ServerMessage;
      setState((prev) => {
        const players = new Map(prev.players);
        const monsters = new Map(prev.monsters);
        let { localHp, localMaxHp, localLevel, localXp, xpToNext } = prev;

        switch (msg.type) {
          case "world_state":
            players.clear();
            for (const [id, p] of Object.entries(msg.players)) {
              if (id !== opts.characterId) players.set(id, { characterId: id, ...p });
              else {
                localHp = p.hp;
                localMaxHp = p.maxHp;
              }
            }
            monsters.clear();
            for (const m of msg.monsters) monsters.set(m.id, m);
            break;

          case "player_joined":
            if (msg.characterId !== opts.characterId)
              players.set(msg.characterId, { characterId: msg.characterId, name: msg.name, x: msg.x, y: msg.y, hp: 100, maxHp: 100 });
            break;

          case "player_left":
            players.delete(msg.characterId);
            break;

          case "player_moved": {
            const p = players.get(msg.characterId);
            if (p) players.set(msg.characterId, { ...p, x: msg.x, y: msg.y });
            break;
          }

          case "combat_result": {
            const m = monsters.get(msg.monsterId);
            if (m) monsters.set(msg.monsterId, { ...m, hp: msg.monsterHp });
            break;
          }

          case "monster_attacked_player":
            if (msg.characterId === opts.characterId) localHp = msg.playerHp;
            break;

          case "monster_died":
            monsters.delete(msg.monsterId);
            break;

          case "xp_gained":
            if (msg.characterId === opts.characterId) {
              localXp = msg.totalXp;
              localLevel = msg.level;
              xpToNext = msg.level * 100;
            }
            break;
        }

        return { ...prev, players, monsters, localHp, localMaxHp, localLevel, localXp, xpToNext };
      });
    };

    return () => ws.close();
  }, [opts.token, opts.characterId]);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { state, send };
}
