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

// Movement speed in world units per second
const MOVE_SPEED = 6;

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
  const localGroupRef = useRef<THREE.Group | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Use code for consistent WASD/arrow detection and avoid scroll
      const code = e.code.toLowerCase();
      if (code === "keyw" || code === "keys" || code === "keya" || code === "keyd" || code.startsWith("arrow")) {
        e.preventDefault();
        keys.add(code);
      }
    };
    const up = (e: KeyboardEvent) => {
      const code = e.code.toLowerCase();
      keys.delete(code);
    };
    const blur = () => {
      keys.clear();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  useFrame((_, delta) => {
    let moved = false;
    let dx = 0;
    let dz = 0;

    if (keys.has("keyw") || keys.has("arrowup")) dz -= 1;
    if (keys.has("keys") || keys.has("arrowdown")) dz += 1;
    if (keys.has("keya") || keys.has("arrowleft")) dx -= 1;
    if (keys.has("keyd") || keys.has("arrowright")) dx += 1;

    if (dx !== 0 || dz !== 0) {
      // Normalize so diagonal movement isn't faster
      const len = Math.hypot(dx, dz) || 1;
      dx /= len;
      dz /= len;

      const distance = MOVE_SPEED * delta;
      localPos.current.x += dx * distance;
      localPos.current.z += dz * distance;
      moved = true;
    }

    if (moved) {
      onMove(localPos.current.x, localPos.current.z);
    }

    // Apply updated position to the local player mesh
    if (localGroupRef.current) {
      localGroupRef.current.position.x = localPos.current.x;
      localGroupRef.current.position.z = localPos.current.z;
    }

    // Camera follows player (isometric offset) without extra lag
    camera.position.set(localPos.current.x + 6, 8, localPos.current.z + 6);
    camera.lookAt(localPos.current);
  });

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
      <group ref={localGroupRef} position={[localPos.current.x, 0.75, localPos.current.z]}>
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
