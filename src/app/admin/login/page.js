"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const { admin, loginAdmin } = useAdmin();
  const router = useRouter();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (admin) {
      router.replace("/admin");
    }
  }, [admin, router]);

  if (admin) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!id.trim() || !password.trim()) {
      setError("ID dan Password harus diisi");
      return;
    }
    const success = loginAdmin(id, password);
    if (success) {
      router.replace("/admin");
    } else {
      setError("ID atau Password salah");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-surface">
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-16 h-16 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-white tracking-tight">Admin</h1>
        <p className="text-sm text-[#94A3B8] mt-1.5 mb-8 text-center">
          Masuk sebagai administrator sistem
        </p>

        {error && (
          <div className="w-full bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-2xl mb-4 text-center font-medium border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-[#94A3B8] mb-2 block">
              Admin ID
            </label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Masukkan ID Admin"
              className="input-field"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#94A3B8] mb-2 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="input-field"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn-primary w-full text-sm mt-1">
            Masuk sebagai Admin
          </button>
        </form>
      </div>

      <Link
        href="/login"
        className="block text-center text-sm text-[#64748B] pb-6 hover:text-[#E2E8F0] transition-colors"
      >
        ← Kembali ke halaman masuk
      </Link>
    </div>
  );
}
