import { Canvas } from "@react-three/fiber";
import { Sky } from "@react-three/drei";

function Scene() {
  return (
    <>
      <Sky sunPosition={[100, 20, 100]} turbidity={8} rayleigh={2} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2d5a27" />
      </mesh>
      {/* Grid on ground (optional visual) */}
      <gridHelper args={[20, 20, "#1a3d18", "#244b20"]} position={[0, 0, 0]} />
      {/* Placeholder “object” in the world (e.g. crate / character placeholder) */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="steelblue" />
      </mesh>
    </>
  );
}

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas
        camera={{ position: [4, 4, 4], fov: 50 }}
        gl={{ antialias: true }}
        shadows
      >
        <Scene />
      </Canvas>
    </div>
  );
}
