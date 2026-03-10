import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sky, Html, useGLTF, useAnimations } from "@react-three/drei";
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

// ─── Monster configs ──────────────────────────────────────────────────────────

interface MonsterConfig {
  bodyColor: string;
  emissive: string;
  bodyW: number;
  bodyH: number;
  bodyD: number;
  headR: number;
  shadowR: number;
  isSlime?: boolean;
  labelColor: string;
}

const MONSTER_CONFIGS: Record<string, MonsterConfig> = {
  slime: {
    bodyColor: "#33ee66", emissive: "#0a2210",
    bodyW: 0.85, bodyH: 0.55, bodyD: 0.85,
    headR: 0, shadowR: 0.45,
    isSlime: true, labelColor: "#88ffaa",
  },
  goblin: {
    bodyColor: "#c8922a", emissive: "#1a0e00",
    bodyW: 0.55, bodyH: 0.85, bodyD: 0.55,
    headR: 0.25, shadowR: 0.38,
    labelColor: "#ffd488",
  },
  orc: {
    bodyColor: "#7a3a1a", emissive: "#120500",
    bodyW: 1.0, bodyH: 1.1, bodyD: 1.0,
    headR: 0.38, shadowR: 0.6,
    labelColor: "#ffaa88",
  },
};

function CrystalMonsterModel({ onClick }: { onClick: () => void }) {
  const { scene } = useGLTF("/assets/monster.glb");
  return (
    <group onClick={onClick} castShadow>
      <primitive object={scene} position={[0, 0, 0]} scale={0.6} />
    </group>
  );
}

function MonsterMesh({ monster, onClick }: { monster: Monster; onClick: () => void }) {
  const hpRatio = Math.max(0, monster.hp / monster.maxHp);
  const cfg: MonsterConfig = MONSTER_CONFIGS[monster.type] ?? {
    bodyColor: "#dd4444", emissive: "#110000",
    bodyW: 0.8, bodyH: 1.0, bodyD: 0.8,
    headR: 0.3, shadowR: 0.45,
    labelColor: "#ffaaaa",
  };

  const hpColor = hpRatio > 0.5 ? "#44dd44" : hpRatio > 0.25 ? "#ddcc22" : "#ee3333";
  const totalH = cfg.isSlime
    ? cfg.bodyW * 0.7          // sphere radius
    : cfg.bodyH + cfg.headR * 2;
  const labelY = totalH + 0.18;

  return (
    <group position={[monster.x, 0, monster.y]}>
      {/* Ground shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
        <circleGeometry args={[cfg.shadowR, 18]} />
        <meshBasicMaterial color="#000" opacity={0.28} transparent />
      </mesh>

      <group position={[0, totalH * 0.5, 0]}>
        <CrystalMonsterModel onClick={onClick} />
      </group>

      {/* Name + HP bar */}
      <Html center position={[0, labelY, 0]} style={{ pointerEvents: "none" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div
            style={{
              color: cfg.labelColor,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "system-ui, sans-serif",
              textShadow: "0 1px 4px #000, 0 0 8px #000",
              whiteSpace: "nowrap",
              letterSpacing: 0.4,
            }}
          >
            {monster.name}
          </div>
          <div
            style={{
              width: 52,
              height: 6,
              background: "rgba(0,0,0,0.7)",
              borderRadius: 3,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            <div
              style={{
                width: `${hpRatio * 100}%`,
                height: "100%",
                background: hpColor,
                transition: "width 0.15s, background 0.3s",
                borderRadius: 3,
              }}
            />
          </div>
        </div>
      </Html>
    </group>
  );
}

// ─── Player mesh (humanoid) ───────────────────────────────────────────────────

function PlayerModel() {
  const gltf = useGLTF("/assets/character.glb");
  const group = useRef<THREE.Group>(null);
  const { actions } = useAnimations(gltf.animations ?? [], group);

  useEffect(() => {
    if (!actions) return;
    const firstAction = Object.values(actions)[0];
    if (!firstAction) return;
    firstAction.reset().play();
    return () => {
      firstAction.stop();
    };
  }, [actions]);

  return (
    <group ref={group}>
      <primitive object={gltf.scene} position={[0, 1.1, 0]} scale={0.65} castShadow />
    </group>
  );
}

function PlayerMesh({
  x, y, name, nameColor, isLocal,
}: {
  x: number; y: number; name: string;
  nameColor: string; isLocal?: boolean;
}) {
  return (
    <group position={[x, 0, y]}>
      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.42, 18]} />
        <meshBasicMaterial color="#000" opacity={0.3} transparent />
      </mesh>

      <PlayerModel />

      {/* Name label */}
      <Html center position={[0, 2.05, 0]} style={{ pointerEvents: "none" }}>
        <div
          style={{
            color: nameColor,
            fontSize: isLocal ? 12 : 11,
            fontWeight: 700,
            fontFamily: "system-ui, sans-serif",
            textShadow: "0 1px 4px #000, 0 0 8px #000",
            whiteSpace: "nowrap",
            letterSpacing: 0.4,
            background: isLocal ? "rgba(74,159,223,0.18)" : "transparent",
            padding: isLocal ? "1px 5px" : "0",
            borderRadius: 3,
          }}
        >
          {isLocal ? `${name} ★` : name}
        </div>
      </Html>
    </group>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────

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
    camera.position.lerp(
      new THREE.Vector3(localPos.current.x + 6, 8, localPos.current.z + 6),
      0.1,
    );
    camera.lookAt(localPos.current);
  });

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
      <PlayerMesh
        x={localPos.current.x}
        y={localPos.current.z}
        name={localName}
        nameColor="#88bbff"
        isLocal
      />

      {/* Other players */}
      {[...players.values()].map((p) => (
        <PlayerMesh
          key={p.characterId}
          x={p.x}
          y={p.y}
          name={p.name}
          nameColor="#ffd488"
        />
      ))}

      {/* Monsters */}
      {[...monsters.values()].map((m) => (
        <MonsterMesh key={m.id} monster={m} onClick={() => onAttack(m.id)} />
      ))}
    </>
  );
}

useGLTF.preload("/assets/monster.glb");
useGLTF.preload("/assets/character.glb");
