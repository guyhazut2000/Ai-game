import { useEffect, useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sky, Html, useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
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

const INITIAL_ORBIT_RADIUS = 10;
const MIN_ORBIT_RADIUS = 4;
const MAX_ORBIT_RADIUS = 24;
const ORBIT_ROTATE_SPEED = 0.005;
const ORBIT_ZOOM_SPEED = 0.6;

// Target heights in world units (metres)
const CHAR_TARGET_HEIGHT = 1.8;
const MONSTER_TARGET_HEIGHT = 1.4;

// ─── Auto-fit GLB to a target height, feet at y=0 ────────────────────────────

function fitModel(scene: THREE.Object3D, targetHeight: number) {
  const box = new THREE.Box3().setFromObject(scene);
  const modelHeight = box.max.y - box.min.y;
  const scale = modelHeight > 0 ? targetHeight / modelHeight : 1;
  const offsetY = -box.min.y * scale;   // push feet to y=0 after scaling
  return { scale, offsetY };
}

// ─── Animation helpers ────────────────────────────────────────────────────────

function getIdleAction(actions: Record<string, THREE.AnimationAction | null>) {
  const names = ["Idle", "idle", "Stand", "stand", "Armature|Idle", "mixamo.com|Layer0"];
  for (const n of names) if (actions[n]) return actions[n]!;
  const all = Object.values(actions).filter(Boolean) as THREE.AnimationAction[];
  return all[0] ?? null;
}

function getWalkAction(actions: Record<string, THREE.AnimationAction | null>) {
  const names = ["Walk", "walk", "Run", "run", "Walking", "Running", "Armature|Walk", "mixamo.com|Layer0.001"];
  for (const n of names) if (actions[n]) return actions[n]!;
  // Fallback: second clip (index 1) when no name matched
  const all = Object.values(actions).filter(Boolean) as THREE.AnimationAction[];
  return all.length > 1 ? all[1] : all[0] ?? null;
}

// ─── Monster configs ──────────────────────────────────────────────────────────

const MONSTER_CONFIGS: Record<string, { shadowR: number; labelColor: string }> = {
  slime:  { shadowR: 0.45, labelColor: "#88ffaa" },
  goblin: { shadowR: 0.38, labelColor: "#ffd488" },
  orc:    { shadowR: 0.60, labelColor: "#ffaa88" },
};

// ─── Monster ──────────────────────────────────────────────────────────────────

function MonsterMesh({ monster, onClick }: { monster: Monster; onClick: () => void }) {
  const gltf = useGLTF("/assets/monster.glb");
  const group = useRef<THREE.Group>(null);

  const clonedScene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene]);
  const { scale, offsetY } = useMemo(() => fitModel(gltf.scene, MONSTER_TARGET_HEIGHT), [gltf.scene]);
  const labelH = offsetY + MONSTER_TARGET_HEIGHT + 0.25;

  const { actions } = useAnimations(gltf.animations, group);

  useEffect(() => {
    console.log("[monster.glb] clips:", Object.keys(actions));
    const idle = getIdleAction(actions);
    idle?.reset().fadeIn(0.3).play();
    return () => { idle?.fadeOut(0.2); };
  }, [actions]);

  const hpRatio = Math.max(0, monster.hp / monster.maxHp);
  const hpColor = hpRatio > 0.5 ? "#44dd44" : hpRatio > 0.25 ? "#ddcc22" : "#ee3333";
  const cfg = MONSTER_CONFIGS[monster.type] ?? { shadowR: 0.45, labelColor: "#ffaaaa" };

  return (
    <group ref={group} position={[monster.x, 0, monster.y]}>
      {/* Ground shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[cfg.shadowR, 18]} />
        <meshBasicMaterial color="#000" opacity={0.28} transparent />
      </mesh>

      <primitive object={clonedScene} scale={scale} position={[0, offsetY, 0]} onClick={onClick} castShadow />

      <Html center position={[0, labelH, 0]} style={{ pointerEvents: "none" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div style={{
            color: cfg.labelColor, fontSize: 11, fontWeight: 700,
            fontFamily: "system-ui, sans-serif",
            textShadow: "0 1px 4px #000, 0 0 8px #000",
            whiteSpace: "nowrap", letterSpacing: 0.4,
          }}>
            {monster.name}
          </div>
          <div style={{
            width: 52, height: 6, background: "rgba(0,0,0,0.7)",
            borderRadius: 3, overflow: "hidden", border: "1px solid rgba(255,255,255,0.18)",
          }}>
            <div style={{
              width: `${hpRatio * 100}%`, height: "100%", background: hpColor,
              transition: "width 0.15s, background 0.3s", borderRadius: 3,
            }} />
          </div>
        </div>
      </Html>
    </group>
  );
}

// ─── Remote player ────────────────────────────────────────────────────────────

function RemotePlayerMesh({ player }: { player: RemotePlayer }) {
  const gltf = useGLTF("/assets/character.glb");
  const group = useRef<THREE.Group>(null);
  const clonedScene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene]);
  const { scale, offsetY } = useMemo(() => fitModel(gltf.scene, CHAR_TARGET_HEIGHT), [gltf.scene]);
  const { actions } = useAnimations(gltf.animations, group);

  useEffect(() => {
    getIdleAction(actions)?.reset().fadeIn(0.3).play();
  }, [actions]);

  return (
    <group ref={group} position={[player.x, 0, player.y]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.42, 18]} />
        <meshBasicMaterial color="#000" opacity={0.3} transparent />
      </mesh>
      <primitive object={clonedScene} scale={scale} position={[0, offsetY, 0]} castShadow />
      <Html center position={[0, offsetY + CHAR_TARGET_HEIGHT + 0.2, 0]} style={{ pointerEvents: "none" }}>
        <div style={{
          color: "#ffd488", fontSize: 11, fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
          textShadow: "0 1px 4px #000, 0 0 8px #000",
          whiteSpace: "nowrap", letterSpacing: 0.4,
        }}>
          {player.name}
        </div>
      </Html>
    </group>
  );
}

// ─── Local player ─────────────────────────────────────────────────────────────

interface LocalPlayerProps {
  localPos: React.MutableRefObject<THREE.Vector3>;
  name: string;
  isMoving: React.MutableRefObject<boolean>;
  facingAngle: React.MutableRefObject<number>;
}

function LocalPlayerMesh({ localPos, name, isMoving, facingAngle }: LocalPlayerProps) {
  const gltf = useGLTF("/assets/character.glb");
  const group = useRef<THREE.Group>(null);
  const clonedScene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene]);
  const { scale, offsetY } = useMemo(() => fitModel(gltf.scene, CHAR_TARGET_HEIGHT), [gltf.scene]);
  const { actions } = useAnimations(gltf.animations, group);

  const currentAnim = useRef<THREE.AnimationAction | null>(null);
  const wasMoving = useRef(false);

  useEffect(() => {
    console.log("[character.glb] clips:", Object.keys(actions));
    const idle = getIdleAction(actions);
    if (idle) { idle.reset().fadeIn(0.3).play(); currentAnim.current = idle; }
    return () => { idle?.fadeOut(0.2); };
  }, [actions]);

  useFrame(() => {
    if (!group.current) return;

    // Position + rotation (no re-render)
    group.current.position.set(localPos.current.x, 0, localPos.current.z);
    group.current.rotation.y = facingAngle.current;

    // Switch animation only when moving state changes
    const moving = isMoving.current;
    if (moving === wasMoving.current) return;
    wasMoving.current = moving;

    const next = moving ? getWalkAction(actions) : getIdleAction(actions);
    if (next && next !== currentAnim.current) {
      currentAnim.current?.fadeOut(0.2);
      next.reset().fadeIn(0.2).play();
      currentAnim.current = next;
    }
  });

  return (
    <group ref={group}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.42, 18]} />
        <meshBasicMaterial color="#000" opacity={0.3} transparent />
      </mesh>
      <primitive object={clonedScene} scale={scale} position={[0, offsetY, 0]} castShadow />
      <Html center position={[0, offsetY + CHAR_TARGET_HEIGHT + 0.2, 0]} style={{ pointerEvents: "none" }}>
        <div style={{
          color: "#88bbff", fontSize: 12, fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
          textShadow: "0 1px 4px #000, 0 0 8px #000",
          whiteSpace: "nowrap", letterSpacing: 0.4,
          background: "rgba(74,159,223,0.18)",
          padding: "1px 5px", borderRadius: 3,
        }}>
          {name} ★
        </div>
      </Html>
    </group>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────

export function GameScene({ localX, localY, localName, players, monsters, onMove, onAttack }: Props) {
  const localPos    = useRef(new THREE.Vector3(localX, 0, localY));
  const isMoving    = useRef(false);
  const facingAngle = useRef(0);

  const orbitState = useRef({
    radius: INITIAL_ORBIT_RADIUS,
    azimuth: Math.PI * 0.25,
    elevation: Math.PI * 0.35,
  });
  const isDraggingOrbit = useRef(false);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  // Left-click drag tracking
  const leftDownPos = useRef<{ x: number; y: number } | null>(null);
  const leftIsDragging = useRef(false);
  const DRAG_THRESHOLD = 5; // px before left-click becomes a camera drag

  const { camera, gl } = useThree();

  useEffect(() => {
    const down = (e: KeyboardEvent) => keys.add(e.key.toLowerCase());
    const up   = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useEffect(() => {
    const el = gl.domElement;
    const onDown = (e: MouseEvent) => {
      if (e.button === 1 || e.button === 2) {
        // Middle / right click — always orbit
        isDraggingOrbit.current = true;
        lastPointer.current = { x: e.clientX, y: e.clientY };
      } else if (e.button === 0) {
        // Left click — record start, decide later
        leftDownPos.current = { x: e.clientX, y: e.clientY };
        leftIsDragging.current = false;
      }
    };
    const onMove = (e: MouseEvent) => {
      // Right / middle drag
      if (isDraggingOrbit.current && lastPointer.current) {
        const dx = e.clientX - lastPointer.current.x;
        const dy = e.clientY - lastPointer.current.y;
        lastPointer.current = { x: e.clientX, y: e.clientY };
        orbitState.current.azimuth  -= dx * ORBIT_ROTATE_SPEED;
        orbitState.current.elevation = THREE.MathUtils.clamp(
          orbitState.current.elevation - dy * ORBIT_ROTATE_SPEED, 0.15, Math.PI / 2 - 0.15,
        );
      }
      // Left drag — activate orbit once threshold crossed
      if (leftDownPos.current) {
        const dx = e.clientX - leftDownPos.current.x;
        const dy = e.clientY - leftDownPos.current.y;
        if (!leftIsDragging.current && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
          leftIsDragging.current = true;
          lastPointer.current = { x: e.clientX, y: e.clientY };
        }
        if (leftIsDragging.current && lastPointer.current) {
          const ddx = e.clientX - lastPointer.current.x;
          const ddy = e.clientY - lastPointer.current.y;
          lastPointer.current = { x: e.clientX, y: e.clientY };
          orbitState.current.azimuth  += ddx * ORBIT_ROTATE_SPEED;
          orbitState.current.elevation = THREE.MathUtils.clamp(
            orbitState.current.elevation + ddy * ORBIT_ROTATE_SPEED, 0.15, Math.PI / 2 - 0.15,
          );
        }
      }
    };
    const onStop = (e: MouseEvent) => {
      if (e.button === 1 || e.button === 2) {
        isDraggingOrbit.current = false;
        lastPointer.current = null;
      } else if (e.button === 0) {
        leftDownPos.current = null;
        leftIsDragging.current = false;
        lastPointer.current = null;
      }
    };
    const onLeave = () => {
      isDraggingOrbit.current = false;
      leftDownPos.current = null;
      leftIsDragging.current = false;
      lastPointer.current = null;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbitState.current.radius = THREE.MathUtils.clamp(
        orbitState.current.radius + (e.deltaY * ORBIT_ZOOM_SPEED) / 100,
        MIN_ORBIT_RADIUS, MAX_ORBIT_RADIUS,
      );
    };
    el.addEventListener("mousedown", onDown);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseup", onStop);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("contextmenu", (e) => e.preventDefault());
    return () => {
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseup", onStop);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("wheel", onWheel);
    };
  }, [gl]);

  useFrame(() => {
    // Camera-relative movement: W = toward camera target, A/D = strafe
    const az = orbitState.current.azimuth;
    const fwdX = -Math.cos(az);   // camera forward projected on XZ
    const fwdZ = -Math.sin(az);

    let dx = 0, dz = 0;
    if (keys.has("w") || keys.has("arrowup"))    { dx += fwdX; dz += fwdZ; }
    if (keys.has("s") || keys.has("arrowdown"))  { dx -= fwdX; dz -= fwdZ; }
    if (keys.has("a") || keys.has("arrowleft"))  { dx += fwdZ; dz -= fwdX; }
    if (keys.has("d") || keys.has("arrowright")) { dx -= fwdZ; dz += fwdX; }

    const moving = dx !== 0 || dz !== 0;
    isMoving.current = moving;

    if (moving) {
      const len = Math.sqrt(dx * dx + dz * dz);
      localPos.current.x += (dx / len) * MOVE_SPEED;
      localPos.current.z += (dz / len) * MOVE_SPEED;
      facingAngle.current = Math.atan2(dx / len, dz / len);
      onMove(localPos.current.x, localPos.current.z);
    }

    const { radius, azimuth, elevation } = orbitState.current;
    // Look at mid-body height (0.9) not feet
    const lookAt = new THREE.Vector3(localPos.current.x, 0.9, localPos.current.z);
    const camTarget = new THREE.Vector3(
      localPos.current.x + radius * Math.cos(elevation) * Math.cos(azimuth),
      0.9 + radius * Math.sin(elevation),
      localPos.current.z + radius * Math.cos(elevation) * Math.sin(azimuth),
    );
    camera.position.lerp(camTarget, 0.1);
    camera.lookAt(lookAt);
  });

  useEffect(() => {
    localPos.current.set(localX, 0, localY);
  }, [localX, localY]);

  return (
    <>
      <Sky sunPosition={[100, 20, 100]} turbidity={8} rayleigh={2} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#2d5a27" />
      </mesh>
      <gridHelper args={[100, 100, "#1a3d18", "#244b20"]} position={[0, 0.01, 0]} />

      <LocalPlayerMesh
        localPos={localPos}
        name={localName}
        isMoving={isMoving}
        facingAngle={facingAngle}
      />

      {[...players.values()].map((p) => (
        <RemotePlayerMesh key={p.characterId} player={p} />
      ))}

      {[...monsters.values()].map((m) => (
        <MonsterMesh key={m.id} monster={m} onClick={() => onAttack(m.id)} />
      ))}
    </>
  );
}

useGLTF.preload("/assets/monster.glb");
useGLTF.preload("/assets/character.glb");
