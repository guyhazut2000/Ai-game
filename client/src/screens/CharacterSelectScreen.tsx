import { useEffect, useState } from "react";
import type { Character, CharacterClass } from "shared";
import { listCharacters, createCharacter } from "../api";

interface Props {
  token: string;
  onSelect: (character: Character) => void;
  onLogout?: () => void;
}

const CLASS_COLORS: Record<CharacterClass, string> = {
  warrior: "#e06c4a",
  archer: "#6cbf6c",
  magician: "#6a9fdf",
};

const CLASS_DESC: Record<CharacterClass, string> = {
  warrior: "High HP & defense. Melee fighter.",
  archer: "Balanced. Agile and precise.",
  magician: "High magic attack. Low defense.",
};

const s = {
  container: {
    width: "100vw",
    height: "100vh",
    background: "linear-gradient(135deg, #0a0e1a 0%, #1a2444 100%)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "system-ui, sans-serif",
    color: "#fff",
  } as React.CSSProperties,
  title: { fontSize: 22, fontWeight: 700, marginBottom: 24, letterSpacing: 1 } as React.CSSProperties,
  grid: { display: "flex", gap: 16, flexWrap: "wrap" as const, justifyContent: "center", maxWidth: 800 },
  card: (selected: boolean): React.CSSProperties => ({
    background: selected ? "rgba(58,123,253,0.25)" : "rgba(255,255,255,0.05)",
    border: `1px solid ${selected ? "#3a7bfd" : "rgba(255,255,255,0.12)"}`,
    borderRadius: 10,
    padding: "20px 24px",
    width: 160,
    cursor: "pointer",
    transition: "all 0.15s",
    textAlign: "center",
  }),
  newCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px dashed rgba(255,255,255,0.2)",
    borderRadius: 10,
    padding: "20px 24px",
    width: 160,
    cursor: "pointer",
    textAlign: "center" as const,
    color: "#8899bb",
  } as React.CSSProperties,
  btn: {
    marginTop: 24,
    padding: "12px 40px",
    background: "#3a7bfd",
    border: "none",
    borderRadius: 6,
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  } as React.CSSProperties,
  label: { fontSize: 12, color: "#aab", marginBottom: 5, letterSpacing: 0.5, display: "block" } as React.CSSProperties,
  input: {
    padding: "8px 10px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 6,
    color: "#fff",
    fontSize: 13,
    marginBottom: 10,
    width: "100%",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,
};

export function CharacterSelectScreen({ token, onSelect, onLogout }: Props) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newClass, setNewClass] = useState<CharacterClass>("warrior");
  const [error, setError] = useState("");

  useEffect(() => {
    listCharacters(token)
      .then(({ characters }) => setCharacters(characters))
      .catch((err: any) => {
        if (err.message?.includes("401") || err.message?.toLowerCase().includes("unauthorized")) {
          onLogout?.();
        } else {
          setError("Failed to load characters");
        }
      });
  }, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const char = await createCharacter(token, newName, newClass);
      setCharacters((prev) => [...prev, char]);
      setCreating(false);
      setNewName("");
      setSelected(char.id);
    } catch (err: any) {
      setError(err.message ?? "Failed to create character");
    }
  }

  function handleEnter() {
    const char = characters.find((c) => c.id === selected);
    if (char) onSelect(char);
  }

  return (
    <div style={s.container}>
      <h2 style={s.title}>Select Character</h2>
      {error && <div style={{ color: "#ff6b6b", marginBottom: 12, fontSize: 13 }}>{error}</div>}
      <div style={s.grid}>
        {characters.map((c) => (
          <div key={c.id} style={s.card(selected === c.id)} onClick={() => setSelected(c.id)}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: CLASS_COLORS[c.class as CharacterClass] ?? "#888",
                margin: "0 auto 10px",
              }}
            />
            <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
            <div style={{ color: "#aab", fontSize: 12, marginTop: 2, textTransform: "capitalize" }}>{c.class}</div>
            <div style={{ color: "#aab", fontSize: 12 }}>Lv. {c.level}</div>
          </div>
        ))}

        {characters.length < 5 && !creating && (
          <div style={s.newCard} onClick={() => setCreating(true)}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>+</div>
            <div style={{ fontSize: 13 }}>New Character</div>
          </div>
        )}

        {creating && (
          <div
            style={{
              ...s.card(false),
              width: 200,
              textAlign: "left",
            }}
          >
            <form onSubmit={handleCreate}>
              <label style={s.label}>NAME</label>
              <input
                style={s.input}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                maxLength={50}
              />
              <label style={s.label}>CLASS</label>
              <select
                style={{ ...s.input, cursor: "pointer" }}
                value={newClass}
                onChange={(e) => setNewClass(e.target.value as CharacterClass)}
              >
                <option value="warrior">Warrior</option>
                <option value="archer">Archer</option>
                <option value="magician">Magician</option>
              </select>
              <div style={{ color: "#8899bb", fontSize: 11, marginBottom: 8 }}>{CLASS_DESC[newClass]}</div>
              <button
                type="submit"
                style={{ ...s.btn, marginTop: 0, padding: "8px 16px", fontSize: 13, width: "100%" }}
              >
                Create
              </button>
            </form>
          </div>
        )}
      </div>

      {selected && (
        <button style={s.btn} onClick={handleEnter}>
          Enter World
        </button>
      )}
    </div>
  );
}
