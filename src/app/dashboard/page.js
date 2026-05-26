'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getItems, getBookings, pickupBooking, getConfig } from '@/services/dbService';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import Navbar from '@/components/Navbar';
import ItemGridCard from '@/components/ItemGridCard';
import BookingCard from '@/components/BookingCard';
import WhatsAppButton from '@/components/WhatsAppButton';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MENU = [
  { key: 'available', label: 'Cek Ketersediaan Barang', icon: '◇', desc: 'Lihat stok barang yang tersedia dan siap dibooking' },
  { key: 'pending', label: 'Cek Status Booking Barang', icon: '○', desc: 'Lihat status pengajuan booking yang masih diproses atau ditolak' },
  { key: 'picked', label: 'Barang Sudah Diangkut', icon: '✓', desc: 'Lihat barang yang sudah diambil dan status pengambilannya' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { addItem: addToCart, items: cartItems, totalItems, removeItem, updateQty } = useCart();
  const [activeMenu, setActiveMenu] = useState(null);
  const [baseItems, setBaseItems] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });
  const [siteConfig, setSiteConfig] = useState({ welcomeHeading: '', welcomeSubtitle: '' });

  // Redirect logged-in users away from / to /dashboard
  useEffect(() => {
    if (pathname === '/') {
      router.replace('/dashboard');
    }
  }, [pathname, router]);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ open: true, message, type });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [itemsData, bookingsData] = await Promise.all([
        getItems(),
        getBookings(),
      ]);
      setBaseItems(itemsData);
      setBookings(bookingsData);
      setSiteConfig(getConfig());
    } catch (err) {
      console.error('Fetch error:', err);
      showToast('Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const cartQtys = useMemo(() => {
    const q = {};
    cartItems.forEach(i => { q[i.itemId] = (q[i.itemId] || 0) + i.qty; });
    return q;
  }, [cartItems]);

  const pendingQtys = useMemo(() => {
    const q = {};
    bookings.filter(b => b.status === 'pending').forEach(b => {
      q[b.itemId] = (q[b.itemId] || 0) + b.qty;
    });
    return q;
  }, [bookings]);

  const allItems = useMemo(() => {
    return baseItems.map(item => ({
      ...item,
      trulyAvailable: item.availableQty - (pendingQtys[item.id] || 0) - (cartQtys[item.id] || 0),
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [baseItems, pendingQtys, cartQtys]);

  const pendingBookings = useMemo(() => bookings.filter(b => b.status === 'pending'), [bookings]);
  const approvedBookings = useMemo(() => bookings.filter(b => b.status === 'approved'), [bookings]);
  const pickedBookings = useMemo(() => bookings.filter(b => b.status === 'approved' || b.status === 'picked_up'), [bookings]);

  const handleAddToCart = (item, qty) => {
    addToCart(item.id, item.name, qty, item.trulyAvailable);
  };

  const handleRemoveFromCart = (itemId) => {
    const inCart = cartItems.find(i => i.itemId === itemId);
    if (!inCart) return;
    if (inCart.qty <= 1) {
      removeItem(itemId);
    } else {
      updateQty(itemId, inCart.qty - 1);
    }
  };

  const handlePickup = async (bookingId) => {
    try {
      await pickupBooking(bookingId);
      showToast('Barang berhasil diambil!', 'success');
      fetchData();
    } catch (err) {
      showToast('Gagal mengonfirmasi pengambilan', 'error');
    }
  };

  const handleBookingClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push('/booking');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-dark-surface">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark-surface">
      <Navbar />
      <WhatsAppButton />

      <div className="flex-1 flex flex-col animate-fade-in-up">
        {/* Welcome */}
        <div className="px-5 pt-7 pb-4">
          <h1 className="text-[22px] font-bold text-white tracking-tight leading-tight">
            {user ? siteConfig.welcomeHeading.replace('{name}', user.displayName || user.email || 'Mitra') : siteConfig.welcomeHeading}
          </h1>
          <p className="text-sm text-[#94A3B8] mt-2 leading-relaxed">
            {siteConfig.welcomeSubtitle}
          </p>
        </div>

        {/* 3 Menu Cards */}
        <div className="px-5 pb-2 space-y-3">
          {MENU.map(menu => (
            <button
              key={menu.key}
              onClick={() => setActiveMenu(menu.key)}
              className="w-full text-left menu-card"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  menu.key === 'pending' ? 'bg-amber-500/10' :
                  menu.key === 'picked' ? 'bg-emerald-500/10' :
                  'bg-primary-500/10'
                }`}>
                  <span className={`text-lg ${
                    menu.key === 'pending' ? 'text-amber-400' :
                    menu.key === 'picked' ? 'text-emerald-400' :
                    'text-primary-400'
                  }`}>{menu.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-[#E2E8F0] leading-snug">
                    {menu.label}
                    {menu.key === 'pending' && pendingBookings.length > 0 && (
                      <span className="ml-2 bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                        {pendingBookings.length}
                      </span>
                    )}
                    {menu.key === 'picked' && pickedBookings.length > 0 && (
                      <span className="ml-2 bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                        {pickedBookings.length}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                    {menu.desc}
                  </p>
                </div>
                <svg className="w-5 h-5 text-dark-border-light shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Quick summary */}
        <div className="px-5 pt-2 pb-3">
          <div className="flex gap-3">
            <div className="flex-1 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl p-3.5 border border-emerald-500/10">
              <p className="text-xs text-[#64748B]">Barang tersedia</p>
              <p className="text-lg font-bold text-emerald-400 mt-1">{allItems.filter(i => i.trulyAvailable > 0).length}</p>
            </div>
            <div className="flex-1 bg-gradient-to-br from-primary-500/5 to-transparent rounded-2xl p-3.5 border border-primary-500/10">
              <p className="text-xs text-[#64748B]">Booking disetujui</p>
              <p className="text-lg font-bold text-primary-400 mt-1">{approvedBookings.length}</p>
            </div>
            <div className="flex-1 bg-gradient-to-br from-amber-500/5 to-transparent rounded-2xl p-3.5 border border-amber-500/10">
              <p className="text-xs text-[#64748B]">Menunggu</p>
              <p className="text-lg font-bold text-amber-400 mt-1">{pendingBookings.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ajukan Booking */}
      <div className="px-5 pb-6 pt-2">
        <button
          onClick={handleBookingClick}
          className="btn-primary w-full text-center text-sm"
        >
          + Ajukan Booking Barang
        </button>
      </div>

      {/* ── Menu Modal: Ketersediaan ── */}
      <Modal
        open={activeMenu === 'available'}
        onClose={() => setActiveMenu(null)}
        title="Ketersediaan Barang"
        full
        footer={totalItems > 0 ? (
          <Link
            href="/checkout"
            className="flex items-center justify-between bg-emerald-500/15 border border-emerald-500/30 rounded-2xl px-4 py-3.5 active:scale-[0.97] transition-all duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-300 leading-tight">Cek keranjang</p>
                <p className="text-[11px] text-emerald-400/60 mt-0.5">{totalItems} item</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-emerald-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : null}
      >
        <div className="grid grid-cols-2 gap-3">
          {allItems.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <span className="text-3xl block mb-3 opacity-30">◇</span>
              <p className="text-sm text-[#64748B]">Tidak ada barang</p>
            </div>
          ) : (
            allItems.map(item => (
              <ItemGridCard
                key={item.id}
                item={item}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                inCartQty={cartQtys[item.id] || 0}
                isHabis={item.trulyAvailable <= 0}
              />
            ))
          )}
        </div>
      </Modal>

      {/* ── Menu Modal: Booking Status ── */}
      <Modal open={activeMenu === 'pending'} onClose={() => setActiveMenu(null)} title="Status Booking" full>
        <div className="space-y-2.5">
          {pendingBookings.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-3xl block mb-3 opacity-30">○</span>
              <p className="text-sm text-[#64748B]">Tidak ada booking yang menunggu</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="chip-yellow">Menunggu</span>
                <span className="text-xs text-[#64748B]">{pendingBookings.length} pengajuan</span>
              </div>
              {pendingBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </>
          )}
        </div>
      </Modal>

      {/* ── Menu Modal: Barang Sudah Diangkut ── */}
      <Modal open={activeMenu === 'picked'} onClose={() => setActiveMenu(null)} title="Barang Sudah Diangkut" full>
        <div className="space-y-2.5">
          {pickedBookings.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-3xl block mb-3 opacity-30">✓</span>
              <p className="text-sm text-[#64748B]">Belum ada barang yang diangkut</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-[#64748B]">
                  {pickedBookings.filter(b => b.status === 'picked_up').length} sudah diambil &middot;{' '}
                  {pickedBookings.filter(b => b.status === 'approved').length} menunggu pickup
                </span>
              </div>
              {pickedBookings.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onPickup={booking.status === 'approved' && user ? handlePickup : undefined}
                />
              ))}
            </>
          )}
        </div>
      </Modal>

      {/* Credit */}
      <div className="px-5 pb-6 pt-2">
        <p className="text-center text-[10px] text-dark-border-light/40 select-none">
          --ini gue buat sendiri ye--
        </p>
      </div>

      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ open: false, message: '', type: 'info' })}
      />
    </div>
  );
}
