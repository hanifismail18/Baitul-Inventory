"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { addBooking, getItems } from "@/services/dbService";
import { onBookingSubmitted } from "@/services/notificationService";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import ErrorBoundary from "@/components/ErrorBoundary";

const PHONE_NUMBER = "62857322263965";
const PROFILE_KEY = "baitul_user_profile";

function CheckoutPageContent() {
  const { user } = useAuth();
  const {
    items: cartItems,
    updateQty,
    removeItem,
    clearCart,
    totalItems,
    cartReady,
  } = useCart();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "info",
  });
  const [confirmModal, setConfirmModal] = useState(false);

  const showToast = useCallback((message, type = "info") => {
    setToast({ open: true, message, type });
  }, []);

  if (!cartReady) {
    return (
      <div className="min-h-screen flex flex-col bg-dark-surface">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-dark-surface">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <span className="text-4xl block mb-4 opacity-30">🛒</span>
          <p className="text-sm text-[#64748B] mb-6">Keranjang masih kosong</p>
          <Link href="/booking" className="btn-primary text-sm">
            + Tambah Barang
          </Link>
        </div>
        <Link
          href="/dashboard"
          className="block text-center text-xs text-[#475569] pb-8 hover:text-[#64748B] transition-colors"
        >
          ← Kembali
        </Link>
      </div>
    );
  }

  const redirectToWhatsApp = (bookings) => {
    const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
    const userName = profile.name || user?.displayName || user?.email || "User";
    const userPhone = profile.phone || "";

    let text = `Halo Admin, ada *Booking Baru* yang diajukan melalui website!\n\n`;

    text += `*Pemesanan:*\n`;
    bookings.forEach((b, i) => {
      text += `${i + 1}. ${b.itemName} — ${b.qty} unit\n`;
    });

    text += `\n*Total:* ${totalItems} barang`;
    text += `\n*Atas nama:* ${userName}`;
    if (userPhone) text += `\n*No. HP:* ${userPhone}`;

    const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleCheckout = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const savedBookings = [];
      const itemsData = await getItems();

      for (const cartItem of cartItems) {
        const item = itemsData.find((i) => i.id === cartItem.itemId);
        if (!item || item.availableQty < cartItem.qty) {
          showToast(`Stok ${cartItem.name} tidak mencukupi`, "error");
          continue;
        }

        const booking = await addBooking({
          itemId: cartItem.itemId,
          itemName: cartItem.name,
          userId: user.uid,
          userName: user.displayName || user.email,
          userEmail: user.email,
          qty: cartItem.qty,
        });

        savedBookings.push(booking);

        await onBookingSubmitted(booking, user).catch(() => {});
      }

      if (savedBookings.length === 0) {
        showToast("Tidak ada barang yang berhasil dibooking", "error");
        setSubmitting(false);
        return;
      }

      clearCart();
      showToast(`${savedBookings.length} barang berhasil diajukan!`, "success");

      setTimeout(() => {
        redirectToWhatsApp(savedBookings);
        router.push("/");
      }, 1200);
    } catch (err) {
      showToast("Gagal memproses booking", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-surface">
      <Navbar />

      <div className="flex-1 px-5 pt-6 pb-6">
        <h1 className="text-xl font-bold text-white tracking-tight">
          Keranjang
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1 mb-5">
          Review barang sebelum diajukan
        </p>

        <div className="space-y-3">
          {cartItems.map((item) => (
            <div
              key={item.itemId}
              className="card-dark flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-[#E2E8F0] text-sm truncate">
                  {item.name}
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Maks: {item.maxQty}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => updateQty(item.itemId, item.qty - 1)}
                  className="w-7 h-7 rounded-lg bg-dark-card-hover flex items-center justify-center text-xs text-[#94A3B8] active:scale-90"
                  disabled={item.qty <= 1}
                >
                  −
                </button>
                <span className="text-sm font-semibold text-[#E2E8F0] w-6 text-center">
                  {item.qty}
                </span>
                <button
                  onClick={() => updateQty(item.itemId, item.qty + 1)}
                  className="w-7 h-7 rounded-lg bg-dark-card-hover flex items-center justify-center text-xs text-[#94A3B8] active:scale-90"
                  disabled={item.qty >= item.maxQty}
                >
                  +
                </button>
                <button
                  onClick={() => removeItem(item.itemId)}
                  className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-xs text-red-400 active:scale-90 ml-1"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/booking"
          className="block text-center text-xs text-[#475569] mt-5 hover:text-[#64748B] transition-colors"
        >
          ← Tambah Barang Lagi
        </Link>
      </div>

      {/* Bottom bar */}
      <div className="sticky bottom-0 bg-dark-surface/95 backdrop-blur-xl border-t border-dark-border px-5 pt-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-[#94A3B8]">
            {cartItems.length} jenis · {totalItems} unit
          </span>
          <span className="text-xs text-[#64748B]">
            Setelah dikonfirmasi akan diarahkan ke WA
          </span>
        </div>
        {user ? (
          <button
            onClick={() => setConfirmModal(true)}
            disabled={submitting}
            className="btn-primary w-full text-sm"
          >
            {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Memproses...
            </span>
          ) : "Konfirmasi & Ajukan"}
          </button>
        ) : (
          <Link
            href="/login"
            className="btn-primary w-full text-sm text-center"
          >
            Login untuk mengajukan booking
          </Link>
        )}
      </div>

      {/* ── Confirm Modal ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setConfirmModal(false)}
          />
          <div className="relative bg-dark-surface w-full max-w-md rounded-t-3xl p-6 pb-8 animate-sheet-up">
            <div className="flex justify-center pb-3">
              <div className="w-8 h-1 rounded-full bg-dark-border-light" />
            </div>
            <div className="text-center mb-5">
              <span className="text-3xl block mb-3">📋</span>
              <h2 className="text-base font-bold text-white tracking-tight">
                Konfirmasi Booking
              </h2>
              <p className="text-sm text-[#94A3B8] mt-1">
                {cartItems.length} jenis barang · {totalItems} unit
              </p>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 mb-4">
              {cartItems.map((item) => (
                <div
                  key={item.itemId}
                  className="flex justify-between text-sm bg-dark-card rounded-xl px-3.5 py-2"
                >
                  <span className="text-[#E2E8F0] truncate mr-2">
                    {item.name}
                  </span>
                  <span className="text-[#94A3B8] shrink-0">
                    {item.qty} unit
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(false)}
                className="flex-1 btn-secondary text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleCheckout}
                disabled={submitting}
                className="flex-1 btn-primary text-sm"
              >
                {submitting ? "Mengirim..." : "Ya, Ajukan"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ open: false, message: "", type: "info" })}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ErrorBoundary>
      <CheckoutPageContent />
    </ErrorBoundary>
  );
}
