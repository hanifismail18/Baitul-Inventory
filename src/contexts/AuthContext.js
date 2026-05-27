'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/config/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(transformUser(session.user));
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(transformUser(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const demoLogin = async (name = 'User Demo', email = 'demo@user.com') => {
    await new Promise(r => setTimeout(r, 600));
    const demoUser = {
      uid: 'demo_' + Date.now(),
      email,
      displayName: name,
      photoURL: null,
    };
    setUser(demoUser);
    return demoUser;
  };

  const loginWithGoogle = async () => {
    setActionLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        return await demoLogin();
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/login',
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google sign-in error:', err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const logout = async () => {
    setActionLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
      await new Promise(r => setTimeout(r, 300));
      setUser(null);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, actionLoading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function transformUser(supabaseUser) {
  return {
    uid: supabaseUser.id,
    email: supabaseUser.email || '',
    displayName: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
    photoURL: supabaseUser.user_metadata?.avatar_url || null,
  };
}
