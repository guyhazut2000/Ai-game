import { Canvas } from "@react-three/fiber";
import type { Character } from "shared";
import { useGameSocket } from "../game/useGameSocket";
import { GameScene } from "../game/GameScene";
import { HUD } from "../game/HUD";

interface Props {
  token: string;
  character: Character;
}

export function GameScreen({ token, character }: Props) {
  const { state, send } = useGameSocket({
    token,
    characterId: character.id,
    initialHp: character.hp,
    initialMaxHp: character.max_hp,
    initialLevel: character.level,
    initialXp: character.xp,
  });

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [6, 8, 6], fov: 50 }} gl={{ antialias: true }} shadows>
        <GameScene
          localX={character.x}
          localY={character.y}
          localName={character.name}
          players={state.players}
          monsters={state.monsters}
          onMove={(x, y) => send({ type: "move", x, y })}
          onAttack={(monsterId) => send({ type: "attack", monsterId })}
        />
      </Canvas>
      <HUD
        name={character.name}
        level={state.localLevel}
        hp={state.localHp}
        maxHp={state.localMaxHp}
        xp={state.localXp}
        xpToNext={state.xpToNext}
        connected={state.connected}
      />
    </div>
  );
}
