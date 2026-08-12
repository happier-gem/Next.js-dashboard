// One-time handoff of freshly-reset credentials from the reset-password page
// to the login page, so the user can review and submit without retyping.
// Stored in sessionStorage (never sent over the network, cleared on read)
// rather than a URL param, which would leak the password into browser
// history and server logs.
const STORAGE_KEY = 'resetPasswordPrefill';

export function stashLoginPrefill(email: string, password: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ email, password }));
  } catch {
    // sessionStorage unavailable (e.g. private mode) — safe to skip.
  }
}

export function consumeLoginPrefill(): { email: string; password: string } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STORAGE_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
