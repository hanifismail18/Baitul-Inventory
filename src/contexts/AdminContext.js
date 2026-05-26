'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext(null);
const STORAGE_KEY = 'baitul_admin';

const ADMIN_CREDENTIALS = {
  id: 'paduka',
  password: 'password',
};

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [adminReady, setAdminReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setAdmin(JSON.parse(saved));
    } catch {}
    setAdminReady(true);
  }, []);

  const loginAdmin = (id, password) => {
    if (id === ADMIN_CREDENTIALS.id && password === ADMIN_CREDENTIALS.password) {
      const data = { id, name: 'Paduka Admin' };
      setAdmin(data);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setAdmin(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <AdminContext.Provider value={{ admin, adminReady, loginAdmin, logoutAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
