import { useState } from "react";
import type { Character } from "shared";
import { LoginScreen } from "./screens/LoginScreen";
import { CharacterSelectScreen } from "./screens/CharacterSelectScreen";
import { GameScreen } from "./screens/GameScreen";

type View = "login" | "charSelect" | "game";

export default function App() {
  const [view, setView] = useState<View>("login");
  const [token, setToken] = useState("");
  const [character, setCharacter] = useState<Character | null>(null);

  if (view === "login") {
    return (
      <LoginScreen
        onLogin={(t) => {
          setToken(t);
          setView("charSelect");
        }}
      />
    );
  }

  if (view === "charSelect") {
    return (
      <CharacterSelectScreen
        token={token}
        onSelect={(char) => {
          setCharacter(char);
          setView("game");
        }}
      />
    );
  }

  if (view === "game" && character) {
    return <GameScreen token={token} character={character} />;
  }

  return null;
}
