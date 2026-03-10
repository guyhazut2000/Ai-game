import { useState } from "react";
import type { Character } from "shared";
import { LoginScreen } from "./screens/LoginScreen";
import { CharacterSelectScreen } from "./screens/CharacterSelectScreen";
import { GameScreen } from "./screens/GameScreen";

type View = "login" | "charSelect" | "game";

const STORAGE_KEY = "auth_token";

export default function App() {
  const [token, setToken] = useState<string>(() => localStorage.getItem(STORAGE_KEY) ?? "");
  const [view, setView] = useState<View>(() => (localStorage.getItem(STORAGE_KEY) ? "charSelect" : "login"));
  const [character, setCharacter] = useState<Character | null>(null);

  function handleLogin(t: string) {
    localStorage.setItem(STORAGE_KEY, t);
    setToken(t);
    setView("charSelect");
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY);
    setToken("");
    setCharacter(null);
    setView("login");
  }

  if (view === "login") {
    return (
      <LoginScreen
        onLogin={(t) => handleLogin(t)}
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
        onLogout={handleLogout}
      />
    );
  }

  if (view === "game" && character) {
    return <GameScreen token={token} character={character} />;
  }

  return null;
}
