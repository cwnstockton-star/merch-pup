import { supabase } from './supabase';
import { withTimeout } from './withTimeout';

// ── Event join links ──
// Fans can join an event by opening /join/<EVENT_CODE> (from a QR code on a
// sign, a shared link, etc.). If they aren't signed in yet, the code is held
// in localStorage until they finish signing up or logging in.

const PENDING_KEY = 'merchpup_pending_join_code';

export function normalizeEventCode(code) {
  return (code || '').trim().toUpperCase();
}

// Full shareable link for an event, e.g. https://merchpup.com/join/K7X2PQ
export function eventJoinUrl(code) {
  return `${window.location.origin}/join/${normalizeEventCode(code)}`;
}

// Saved codes expire so an abandoned link doesn't auto-join someone days later
const PENDING_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function savePendingJoinCode(code) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ code: normalizeEventCode(code), savedAt: Date.now() }));
  } catch { /* storage unavailable */ }
}

export function clearPendingJoinCode() {
  try { localStorage.removeItem(PENDING_KEY); } catch { /* storage unavailable */ }
}

// Returns the saved code (if any) and removes it, so it's only used once.
export function takePendingJoinCode() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    localStorage.removeItem(PENDING_KEY);
    if (!raw) return null;
    const { code, savedAt } = JSON.parse(raw);
    if (!code || Date.now() - savedAt > PENDING_MAX_AGE_MS) return null;
    return code;
  } catch {
    return null;
  }
}

// Looks up an event by code and connects the fan to it.
// Returns the event id, or null if no event has that code.
export async function joinEventByCode(fanId, code) {
  const { data: event, error } = await withTimeout(
    supabase.from('events').select('id').eq('event_code', normalizeEventCode(code)).maybeSingle()
  );
  if (error) throw error;
  if (!event) return null;

  // upsert so re-joining the same event is harmless
  const { error: connectError } = await withTimeout(
    supabase.from('event_connections').upsert(
      { fan_id: fanId, event_id: event.id },
      { onConflict: 'fan_id,event_id' }
    )
  );
  if (connectError) throw connectError;

  return event.id;
}

// After sign-in / sign-up: if a join link was opened earlier, connect the fan
// to that event and return where to go next. Falls back to `fallbackPath`.
export async function resolvePendingJoin(fanId, fallbackPath) {
  const code = takePendingJoinCode();
  if (!code) return { path: fallbackPath };
  try {
    const eventId = await joinEventByCode(fanId, code);
    if (eventId) return { path: `/events/${eventId}`, state: { autoFollowed: true } };
  } catch {
    // fall through — the fan can still enter the code by hand
  }
  return { path: '/connect-event', state: { joinCode: code, joinFailed: true } };
}
