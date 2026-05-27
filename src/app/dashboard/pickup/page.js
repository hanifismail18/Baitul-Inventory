'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import BookingCard from '@/components/BookingCard';
import { useRealtime } from '@/hooks/useRealtime';
import { useAuth } from '@/contexts/AuthContext';
import { getBookings, pickupBooking } from '@/services/dbService';
import Toast from '@/components/Toast';

const TABS = [
  { key: 'active', label: 'Menunggu Pickup' },
  { key: 'history', label: 'Riwayat' },
];

export default function PickupPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });
  const [activeTab, setActiveTab] = useState('active');

  const showToast = useCallback((message, type = 'info') => {
    setToast({ open: true, message, type });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const data = await getBookings();
      setBookings(data);
    } catch (err) {
      showToast('Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useRealtime('bookings', fetchData);

  const waitingPickup = useMemo(() => {
    if (!user?.email) return [];
    return bookings.filter(b => b.status === 'approved' && b.userEmail === user.email);
  }, [bookings, user]);

  const allPickupHistory = useMemo(() => {
    return bookings.filter(b => b.status === 'approved' || b.status === 'picked_up' || b.status === 'expired');
  }, [bookings]);

  const handlePickup = async (bookingId) => {
    try {
      await pickupBooking(bookingId);
      showToast('Barang berhasil diambil!', 'success');
      fetchData();
    } catch (err) {
      showToast('Gagal mengonfirmasi pengambilan', 'error');
    }
  };

  const displayBookings = activeTab === 'active' ? waitingPickup : allPickupHistory;

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

      <div className="flex-1">
        {/* Header */}
        <div className="px-5 pt-7 pb-4">
          <h1 className="text-[22px] font-bold text-white tracking-tight leading-tight">
            Barang Diangkut
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1 leading-relaxed">
            Konfirmasi pengambilan barang atau lihat riwayat barang yang sudah diangkut.
          </p>
        </div>

        {/* Tabs */}
        <div className="px-5 pb-4">
          <div className="flex bg-dark-card rounded-2xl p-1 border border-dark-border">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-primary-500/10 text-primary-400 shadow-sm'
                    : 'text-[#64748B]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pb-6">
          {displayBookings.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-3xl block mb-3 opacity-30">✓</span>
              <p className="text-sm text-[#64748B]">
                {activeTab === 'active'
                  ? 'Tidak ada barang yang menunggu pickup'
                  : 'Belum ada riwayat pengangkutan'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Summary bar for history view */}
              {activeTab === 'history' && (
                <div className="flex items-center gap-3 mb-3 text-xs text-[#64748B]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
                    {allPickupHistory.filter(b => b.status === 'picked_up').length} sudah diambil
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500/60" />
                    {allPickupHistory.filter(b => b.status === 'approved').length} menunggu
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500/60" />
                    {allPickupHistory.filter(b => b.status === 'expired').length} kadaluarsa
                  </span>
                </div>
              )}
              {displayBookings.map(b => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  onPickup={b.status === 'approved' && user ? handlePickup : undefined}
                />
              ))}
            </div>
          )}
        </div>
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
