import Cookies from "js-cookie";

const TOKEN_KEY = "manhole_admin_token";

export function setToken(token: string) {
  // 12h expiry to match typical short-lived admin sessions; adjust to match
  // whatever expiry your backend issues JWTs with.
  Cookies.set(TOKEN_KEY, token, { expires: 0.5, sameSite: "lax" });
}

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

export function clearToken() {
  Cookies.remove(TOKEN_KEY);
}
