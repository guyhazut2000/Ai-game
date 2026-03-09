import type { Character } from "shared";

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const body = await res.json();
  if (!res.ok) throw new Error((body as any).error ?? res.statusText);
  return body as T;
}

function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

// ---- Auth ----
export async function register(username: string, password: string): Promise<{ accountId: string }> {
  return req("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

export async function login(username: string, password: string): Promise<{ token: string; accountId: string }> {
  return req("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

// ---- Characters ----
export async function listCharacters(token: string): Promise<{ characters: Character[] }> {
  return req("/player/characters", { headers: authHeaders(token) });
}

export async function createCharacter(
  token: string,
  name: string,
  cls: string,
): Promise<Character> {
  return req("/player/characters", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ name, class: cls }),
  });
}
