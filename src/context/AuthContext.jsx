import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/withTimeout';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(false);
  const [profileError, setProfileError] = useState(false);

  useEffect(() => {
    let settled = false;

    // Safety valve: supabase-js serializes auth calls across tabs via a
    // browser-wide lock, and a tab that dies mid-operation can leave it
    // held, hanging getSession() forever in every other tab. Surface an
    // error instead of spinning forever if that happens.
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        setInitError(true);
        setLoading(false);
      }
    }, 8000);

    // Grab the session on first load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Keep session in sync across tabs / token refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session) {
          await fetchProfile(session.user.id);
        } else {
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
    setProfileError(false);
    try {
      const { data } = await withTimeout(
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      );

      if (data) {
        setProfile(data);
      } else {
        // Profile row not yet created (e.g. DB trigger pending) — fall back to
        // user_metadata written at signup so role-based routing still works.
        const { data: { user } } = await withTimeout(supabase.auth.getUser());
        if (user?.user_metadata) {
          setProfile({ id: userId, email: user.email, ...user.user_metadata });
        }
      }
    } catch {
      // Don't let a slow/failed fetch masquerade as "wrong role" — ProtectedRoute
      // treats a null profile as a role mismatch and redirects, which would
      // silently bounce a user off a page (e.g. mid order-confirmation) instead
      // of just retrying. Surface it instead.
      setProfileError(true);
    } finally {
      setLoading(false);
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
