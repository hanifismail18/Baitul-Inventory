"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useCart } from "@/contexts/CartContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

function Spinner({ className = "w-4 h-4" }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export default function Navbar() {
  const { user, actionLoading, loginWithGoogle, logout } = useAuth();
  const { admin, logoutAdmin } = useAdmin();
  const { totalItems } = useCart();
  const pathname = usePathname() || "";
  const router = useRouter();

  const showCart =
    pathname !== "/checkout" &&
    pathname !== "/login" &&
    !pathname.startsWith("/admin");

  const handleLogout = async () => {
    if (admin) {
      logoutAdmin();
    } else {
      await logout();
    }
    router.push('/dashboard');
  };

  const handleLogin = async () => {
    await loginWithGoogle();
    router.push('/dashboard');
  };

  return (
    <header className="sticky top-0 z-30 bg-dark-surface/80 backdrop-blur-xl border-b border-dark-border">
      <div className="flex items-center justify-between px-5 h-14">
        <Link href="/dashboard" className="flex items-center gap-2.5 active:scale-95 transition-transform">
          <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center shadow-[0_2px_12px_rgba(99,102,241,0.25)]">
            <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="font-semibold text-[#E2E8F0] text-[15px] tracking-tight">
            Baitul Garbera
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {admin ? (
            <>
              <Link
                href="/admin"
                className="text-xs font-semibold px-4 py-2 rounded-xl bg-primary-500/20 text-primary-300 border border-primary-500/40 active:scale-90 transition-all"
              >
                Panel
              </Link>
              <button
                onClick={handleLogout}
                disabled={actionLoading}
                className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 active:scale-90 transition-all hover:bg-red-500/20 disabled:opacity-50"
                title="Keluar"
              >
                {actionLoading ? (
                  <Spinner className="w-4 h-4" />
                ) : (
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                )}
              </button>
            </>
          ) : (
            <>
              {showCart && (
                <Link
                  href="/checkout"
                  className="relative w-9 h-9 rounded-xl bg-dark-elevated border border-dark-border-light flex items-center justify-center active:scale-90 transition-all hover:border-primary-500/50 hover:bg-primary-500/5"
                  title="Keranjang"
                >
                  <svg
                    className="w-4.5 h-4.5 text-[#94A3B8]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                    />
                  </svg>
                  {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary-500 text-white text-[9px] font-bold flex items-center justify-center shadow-[0_2px_6px_rgba(99,102,241,0.5)] ring-2 ring-dark-surface">
                      {totalItems > 9 ? "9+" : totalItems}
                    </span>
                  )}
                </Link>
              )}

              {user ? (
                <button
                  onClick={handleLogout}
                  disabled={actionLoading}
                  className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 active:scale-90 transition-all hover:bg-red-500/20 disabled:opacity-50"
                  title="Keluar"
                >
                  {actionLoading ? (
                    <Spinner className="w-4 h-4" />
                  ) : (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleLogin}
                  disabled={actionLoading}
                  className="w-9 h-9 rounded-xl bg-primary-500/20 border border-primary-500/40 flex items-center justify-center text-primary-300 active:scale-90 transition-all hover:bg-primary-500/30 disabled:opacity-50"
                  title="Masuk"
                >
                  {actionLoading ? (
                    <Spinner className="w-4 h-4 text-primary-300" />
                  ) : (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0110.5 3h6a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0116.5 21h-6a2.25 2.25 0 01-2.25-2.25V15m-3 0l-3-3m0 0l3-3m-3 3H15" />
                    </svg>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
