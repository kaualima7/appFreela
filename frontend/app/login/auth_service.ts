import { API_URL } from "@/app/api";

const TOKEN_KEY = "auth_token";
export const SESSION_CHANGED = "freelike-session-changed";

export type AccountType = "CLIENT" | "FREELANCER";
export type SessionUser = {
  id: number;
  name: string;
  email: string;
  accountType: AccountType;
};
export type AuthSession = { access_token: string; user: SessionUser };

export function accountHome(accountType: AccountType) {
  return accountType === "CLIENT" ? "/client" : "/admin";
}

export function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
}

export function saveSession(session: AuthSession) {
  localStorage.setItem(TOKEN_KEY, session.access_token);
  window.dispatchEvent(new Event(SESSION_CHANGED));
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(SESSION_CHANGED));
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  // O recarregamento evita disputa com o redirecionamento da área protegida.
  window.location.replace("/");
}

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
) {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(url, {
    ...options,
    headers,
    cache: "no-store",
    signal: options.signal ?? AbortSignal.timeout(15000),
  });
  // Uma resposta atrasada da sessão anterior não deve apagar um novo login.
  if (response.status === 401 && token && getToken() === token) clearToken();
  return response;
}

export async function currentUser(
  signal: AbortSignal,
): Promise<SessionUser | null> {
  if (!getToken()) return null;
  const response = await authenticatedFetch(`${API_URL}/users`, { signal });
  if (response.status === 401) return null;
  if (response.status === 403)
    throw new Error("Sua conta não tem permissão para consultar a sessão.");
  if (!response.ok)
    throw new Error("Não foi possível verificar sua sessão. Tente novamente.");
  const users: SessionUser[] | null = await response.json().catch(() => null);
  if (!Array.isArray(users) || users.length !== 1)
    throw new Error("Não foi possível identificar sua conta.");
  const user = users[0];
  if (
    !Number.isInteger(user.id) ||
    typeof user.name !== "string" ||
    typeof user.email !== "string" ||
    !["CLIENT", "FREELANCER"].includes(user.accountType)
  ) {
    throw new Error("Não foi possível identificar sua conta.");
  }
  return user;
}
