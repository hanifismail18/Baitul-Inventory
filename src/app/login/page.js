'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PROFILE_KEY = 'baitul_user_profile';

export default function LoginPage() {
  const { user, loading: authLoading, loginWithGoogle } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      try {
        const profile = JSON.parse(saved);
        if (profile.name) setName(profile.name);
        if (profile.phone) setPhone(profile.phone);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setReady(true); return; }

    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.name && p.phone) {
          router.replace('/dashboard');
          return;
        }
      } catch {}
    }
    if (step === 'login') {
      setName(user.displayName || '');
      setStep('form');
    }
    setReady(true);
  }, [user, authLoading, router, step]);

  if (authLoading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-surface">
        <div className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const u = await loginWithGoogle();
      setName(u?.displayName || u?.email || '');
      setStep('form');
    } catch (err) {
      setError('Gagal masuk. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = () => {
    if (!name.trim()) { setError('Nama harus diisi'); return; }
    if (!phone.trim() || phone.trim().length < 8) { setError('Nomor HP tidak valid'); return; }

    const profile = { name: name.trim(), phone: phone.trim() };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    router.replace('/dashboard');
  };

  // ── Step: Initial Login ──
  if (step === 'login') {
    return (
      <div className="min-h-screen flex flex-col bg-dark-surface">
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center mb-5 shadow-[0_8px_32px_rgba(99,102,241,0.2)]">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-white tracking-tight">Masuk untuk Booking</h1>
          <p className="text-sm text-[#94A3B8] mt-1.5 mb-8 text-center leading-relaxed">
            Gunakan akun Google-mu untuk mulai booking barang
          </p>

          {error && (
            <div className="w-full bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-2xl mb-4 text-center font-medium border border-red-500/20">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-dark-card border border-dark-border-light rounded-2xl px-6 py-3.5 text-sm font-semibold text-[#E2E8F0] active:scale-[0.97] transition-all duration-200 disabled:opacity-60 hover:bg-dark-card-hover"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-dark-border-light border-t-primary-500 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {loading ? 'Memproses...' : 'Lanjutkan dengan Google'}
          </button>

          <p className="text-xs text-[#475569] mt-6 text-center leading-relaxed">
            Data kamu aman dan tidak akan dibagikan
          </p>
        </div>

        <div className="px-8 pb-8">
          <div className="text-center">
            <span className="text-xs text-[#475569]">Administrator? </span>
            <Link href="/admin/login" className="text-xs font-medium text-[#64748B] hover:text-primary-400 transition-colors">
              Masuk sebagai admin
            </Link>
          </div>
          <Link href="/dashboard" className="block text-center text-xs text-[#475569] mt-3 hover:text-[#64748B] transition-colors">
            ← Kembali
          </Link>
        </div>
      </div>
    );
  }

  // ── Step: Complete Profile ──
  return (
    <div className="min-h-screen flex flex-col bg-dark-surface">
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
          <span className="text-2xl text-emerald-400">✓</span>
        </div>

        <h1 className="text-xl font-bold text-white tracking-tight">Lengkapi Data</h1>
        <p className="text-sm text-[#94A3B8] mt-1.5 mb-8 text-center leading-relaxed">
          Isi nama dan nomor HP untuk melanjutkan
        </p>

        {error && (
          <div className="w-full bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-2xl mb-4 text-center font-medium border border-red-500/20">
            {error}
          </div>
        )}

        <div className="w-full space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-[#94A3B8] mb-2 block">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Masukkan nama lengkap"
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#94A3B8] mb-2 block">Nomor HP</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="08123456789"
              className="input-field"
            />
          </div>
          <button
            onClick={handleCompleteProfile}
            className="btn-primary w-full text-sm mt-2"
          >
            Lanjutkan
          </button>
        </div>
      </div>

      <Link href="/dashboard" className="block text-center text-xs text-[#475569] pb-8 hover:text-[#64748B] transition-colors">
        ← Kembali
      </Link>
    </div>
  );
}
