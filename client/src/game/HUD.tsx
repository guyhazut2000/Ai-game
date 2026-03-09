interface Props {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  xp: number;
  xpToNext: number;
  connected: boolean;
}

export function HUD({ name, level, hp, maxHp, xp, xpToNext, connected }: Props) {
  const hpRatio = Math.max(0, hp / maxHp);
  const xpRatio = Math.min(1, xp / xpToNext);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        background: "rgba(0,0,0,0.65)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        padding: "14px 18px",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        minWidth: 200,
        userSelect: "none",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
        {name}{" "}
        <span style={{ color: "#ffd066", fontWeight: 400, fontSize: 13 }}>Lv.{level}</span>
        {!connected && <span style={{ color: "#ff6b6b", fontSize: 11, marginLeft: 8 }}>⚠ Connecting…</span>}
      </div>

      {/* HP bar */}
      <div style={{ fontSize: 11, color: "#bbb", marginBottom: 3 }}>
        HP {hp} / {maxHp}
      </div>
      <div style={{ width: "100%", height: 8, background: "#333", borderRadius: 4, marginBottom: 8, overflow: "hidden" }}>
        <div
          style={{
            width: `${hpRatio * 100}%`,
            height: "100%",
            background: hpRatio > 0.5 ? "#44cc44" : hpRatio > 0.25 ? "#ddcc22" : "#cc2222",
            transition: "width 0.2s",
            borderRadius: 4,
          }}
        />
      </div>

      {/* XP bar */}
      <div style={{ fontSize: 11, color: "#bbb", marginBottom: 3 }}>
        XP {xp} / {xpToNext}
      </div>
      <div style={{ width: "100%", height: 6, background: "#333", borderRadius: 3, overflow: "hidden" }}>
        <div
          style={{
            width: `${xpRatio * 100}%`,
            height: "100%",
            background: "#4a9fdf",
            transition: "width 0.2s",
            borderRadius: 3,
          }}
        />
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: "#888" }}>WASD/arrows to move · Click monster to attack</div>
    </div>
  );
}
