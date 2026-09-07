import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/withTimeout';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(false);
  const [profileError, setProfileError] = useState(false);
  // Tracks the most recently requested profile fetch so a slower, superseded
  // call (e.g. from a token refresh that overlaps a still-in-flight fetch)
  // can't clobber state with stale results after a newer one already landed.
  const latestUserId = useRef(null);

  useEffect(() => {
    let gotFirstEvent = false;

    // Safety valve: supabase-js serializes auth calls across tabs via a
    // browser-wide lock, and a tab that dies mid-operation can leave it
    // held, hanging auth calls forever in every other tab. Surface an
    // error instead of spinning forever if that happens.
    const timeout = setTimeout(() => {
      if (!gotFirstEvent) {
        setInitError(true);
        setLoading(false);
      }
    }, 8000);

    // onAuthStateChange fires immediately with the current session on
    // subscribe (an 'INITIAL_SESSION' event), so this alone covers the
    // initial load too — a separate getSession() call here would run in
    // parallel with this and race it, occasionally committing a stale
    // profile:null render in between the two.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        gotFirstEvent = true;
        clearTimeout(timeout);
        setSession(session);
        if (session) {
          await fetchProfile(session.user.id);
        } else {
          latestUserId.current = null;
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId) {
    latestUserId.current = userId;
    setProfileError(false);
    try {
      const { data } = await withTimeout(
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      );
      if (latestUserId.current !== userId) return; // superseded by a newer fetch

      if (data) {
        setProfile(data);
      } else {
        // Profile row not yet created (e.g. DB trigger pending) — fall back to
        // user_metadata written at signup so role-based routing still works.
        const { data: { user } } = await withTimeout(supabase.auth.getUser());
        if (latestUserId.current !== userId) return;
        if (user?.user_metadata) {
          setProfile({ id: userId, email: user.email, ...user.user_metadata });
        }
      }
    } catch {
      // Don't let a slow/failed fetch masquerade as "wrong role" — ProtectedRoute
      // treats a null profile as a role mismatch and redirects, which would
      // silently bounce a user off a page (e.g. mid order-confirmation) instead
      // of just retrying. Surface it instead.
      if (latestUserId.current === userId) setProfileError(true);
    } finally {
      if (latestUserId.current === userId) setLoading(false);
    }
  }

  async function signUp(email, password, metadata) {
    const { data, error } = await withTimeout(
      supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      })
    );
    // data.session is null when email confirmation is required
    return { error, needsConfirmation: !error && !data.session };
  }

  async function signIn(email, password) {
    const { error } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password })
    );
    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, initError, profileError, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
