/**
 * auth.js — FestiveCart authentication & role management (RBAC)
 *
 * Uses SHA-256 digests via Web Crypto API — no plaintext passwords in source.
 * Demo passcodes can be entered on the login form or via 1-click demo role buttons.
 *
 * Session is stored in sessionStorage and clears when the tab closes.
 */

const SESSION_KEY = "fc_user_session";

// SHA-256 hex digests (no plaintext secrets in source)
const DEMO_USERS = [
  {
    id: "u1",
    name: "Priya Sharma",
    email: "customer@festivecart.com",
    passDigest: "b041c0aeb35bb0fa4aa668ca5a920b590196fdaf9a00eb852c9b7f4d123cc6d6",
    role: "customer",
    avatar: "PS",
  },
  {
    id: "u2",
    name: "Admin User",
    email: "admin@festivecart.com",
    passDigest: "927b25cca14a91a727485f40e8820e1ae11476bf25b256c7cd5b864257b08393",
    role: "admin",
    avatar: "AU",
  },
];

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const buf  = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function saveSession(user) {
  const session = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

/** Returns the logged-in user object, or null */
export function getCurrentUser() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn() { return !!getCurrentUser(); }
export function isAdmin()    { return getCurrentUser()?.role === "admin"; }
export function isCustomer() { return getCurrentUser()?.role === "customer"; }

/**
 * Attempts login with email + passcode. Returns { success, user } or { success: false, error }.
 */
export async function login(email, passcode) {
  const normalized = email.toLowerCase().trim();
  const user = DEMO_USERS.find((u) => u.email === normalized);
  if (!user) return { success: false, error: "Invalid email or passcode." };

  const digest = await sha256Hex(passcode);
  if (digest !== user.passDigest) {
    return { success: false, error: "Invalid email or passcode." };
  }
  return { success: true, user: saveSession(user) };
}

/**
 * Signs into a demo role directly (used by the Quick Demo Sign-In buttons).
 */
export function loginDemoRole(role) {
  const user = DEMO_USERS.find((u) => u.role === role);
  if (!user) return { success: false, error: "Unknown role." };
  return { success: true, user: saveSession(user) };
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}
