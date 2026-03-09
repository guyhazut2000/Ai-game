import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sky, Html } from "@react-three/drei";
import * as THREE from "three";
import type { Monster } from "shared";
import type { RemotePlayer } from "./useGameSocket";

interface Props {
  localX: number;
  localY: number;
  localName: string;
  players: Map<string, RemotePlayer>;
  monsters: Map<string, Monster>;
  onMove: (x: number, y: number) => void;
  onAttack: (monsterId: string) => void;
}

const MOVE_SPEED = 0.08;

const keys = new Set<string>();

function MonsterMesh({ monster, onClick }: { monster: Monster; onClick: () => void }) {
  const hpRatio = monster.hp / monster.maxHp;
  const colors: Record<string, string> = { slime: "#55dd55", goblin: "#cc9933", orc: "#884422" };
  const sizes: Record<string, [number, number, number]> = { slime: [0.7, 0.7, 0.7], goblin: [0.8, 1, 0.8], orc: [1.2, 1.4, 1.2] };
  const color = colors[monster.type] ?? "#ff4444";
  const [w, h, d] = sizes[monster.type] ?? [1, 1, 1];

  return (
    <group position={[monster.x, h / 2, monster.y]}>
      <mesh onClick={onClick} castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* HP bar above monster */}
      <Html center position={[0, h / 2 + 0.4, 0]} style={{ pointerEvents: "none" }}>
        <div
          style={{
            width: 40,
            height: 4,
            background: "#333",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div style={{ width: `${hpRatio * 100}%`, height: "100%", background: "#e44", transition: "width 0.15s" }} />
        </div>
        <div style={{ color: "#fff", fontSize: 10, textAlign: "center", textShadow: "0 1px 2px #000" }}>
          {monster.name}
        </div>
      </Html>
    </group>
  );
}

function OtherPlayer({ player }: { player: RemotePlayer }) {
  return (
    <group position={[player.x, 0.75, player.y]}>
      <mesh castShadow>
        <boxGeometry args={[0.8, 1.5, 0.8]} />
        <meshStandardMaterial color="#e8a44a" />
      </mesh>
      <Html center position={[0, 1.2, 0]} style={{ pointerEvents: "none" }}>
        <div style={{ color: "#fff", fontSize: 10, textShadow: "0 1px 2px #000", whiteSpace: "nowrap" }}>
          {player.name}
        </div>
      </Html>
    </group>
  );
}

export function GameScene({ localX, localY, localName, players, monsters, onMove, onAttack }: Props) {
  const localPos = useRef(new THREE.Vector3(localX, 0, localY));
  const { camera } = useThree();

  useEffect(() => {
    const down = (e: KeyboardEvent) => keys.add(e.key.toLowerCase());
    const up = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useFrame(() => {
    let moved = false;
    if (keys.has("w") || keys.has("arrowup"))    { localPos.current.z -= MOVE_SPEED; moved = true; }
    if (keys.has("s") || keys.has("arrowdown"))  { localPos.current.z += MOVE_SPEED; moved = true; }
    if (keys.has("a") || keys.has("arrowleft"))  { localPos.current.x -= MOVE_SPEED; moved = true; }
    if (keys.has("d") || keys.has("arrowright")) { localPos.current.x += MOVE_SPEED; moved = true; }
    if (moved) onMove(localPos.current.x, localPos.current.z);
    // Camera follows player (isometric offset)
    camera.position.lerp(
      new THREE.Vector3(localPos.current.x + 6, 8, localPos.current.z + 6),
      0.1,
    );
    camera.lookAt(localPos.current);
  });

  // Sync external position updates (world_state)
  useEffect(() => {
    localPos.current.set(localX, 0, localY);
  }, [localX, localY]);

  return (
    <>
      <Sky sunPosition={[100, 20, 100]} turbidity={8} rayleigh={2} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#2d5a27" />
      </mesh>
      <gridHelper args={[60, 60, "#1a3d18", "#244b20"]} position={[0, 0.01, 0]} />

      {/* Local player */}
      <group position={[localPos.current.x, 0.75, localPos.current.z]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 1.5, 0.8]} />
          <meshStandardMaterial color="#4a9fdf" />
        </mesh>
        <Html center position={[0, 1.2, 0]} style={{ pointerEvents: "none" }}>
          <div style={{ color: "#7df", fontSize: 10, fontWeight: 700, textShadow: "0 1px 2px #000", whiteSpace: "nowrap" }}>
            {localName} (you)
          </div>
        </Html>
      </group>

      {/* Other players */}
      {[...players.values()].map((p) => (
        <OtherPlayer key={p.characterId} player={p} />
      ))}

      {/* Monsters */}
      {[...monsters.values()].map((m) => (
        <MonsterMesh key={m.id} monster={m} onClick={() => onAttack(m.id)} />
      ))}
    </>
  );
}
