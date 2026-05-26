'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, isConfigured } from '@/services/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // ── Demo login (tanpa Firebase) ──
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
      if (!isConfigured()) {
        return await demoLogin();
      }
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const userData = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoURL: fbUser.photoURL,
      };
      setUser(userData);
      return userData;
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
      if (isConfigured()) {
        await signOut(auth);
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
