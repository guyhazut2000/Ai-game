import { useState } from "react";
import { login, register } from "../api";

interface Props {
  onLogin: (token: string, accountId: string) => void;
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100vw",
    height: "100vh",
    background: "linear-gradient(135deg, #0a0e1a 0%, #1a2444 100%)",
    fontFamily: "system-ui, sans-serif",
  } as React.CSSProperties,
  card: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: "40px 48px",
    width: 340,
    color: "#fff",
  } as React.CSSProperties,
  title: { margin: "0 0 8px", fontSize: 26, fontWeight: 700, letterSpacing: 1 } as React.CSSProperties,
  subtitle: { margin: "0 0 28px", color: "#8899bb", fontSize: 13 } as React.CSSProperties,
  label: { display: "block", fontSize: 12, color: "#aab", marginBottom: 5, letterSpacing: 0.5 } as React.CSSProperties,
  input: {
    width: "100%",
    padding: "10px 12px",
    marginBottom: 16,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 6,
    color: "#fff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  } as React.CSSProperties,
  btn: {
    width: "100%",
    padding: "12px",
    background: "#3a7bfd",
    border: "none",
    borderRadius: 6,
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
  } as React.CSSProperties,
  toggle: {
    marginTop: 18,
    textAlign: "center" as const,
    color: "#8899bb",
    fontSize: 13,
  },
  toggleLink: { color: "#6ab0ff", cursor: "pointer", textDecoration: "underline" },
  error: { color: "#ff6b6b", fontSize: 13, marginBottom: 12 },
};

export function LoginScreen({ onLogin }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await register(username, password);
      }
      const { token, accountId } = await login(username, password);
      onLogin(token, accountId);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>AI RPG</h1>
        <p style={styles.subtitle}>{mode === "login" ? "Sign in to continue" : "Create a new account"}</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>USERNAME</label>
          <input
            style={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
          />
          <label style={styles.label}>PASSWORD</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "…" : mode === "login" ? "Login" : "Register"}
          </button>
        </form>
        <div style={styles.toggle}>
          {mode === "login" ? (
            <>
              No account?{" "}
              <span style={styles.toggleLink} onClick={() => setMode("register")}>
                Register
              </span>
            </>
          ) : (
            <>
              Have an account?{" "}
              <span style={styles.toggleLink} onClick={() => setMode("login")}>
                Login
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
