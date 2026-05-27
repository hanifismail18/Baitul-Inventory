'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import BookingCard from '@/components/BookingCard';
import { useAuth } from '@/contexts/AuthContext';
import { getBookings } from '@/services/dbService';
import Toast from '@/components/Toast';

const TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Disetujui' },
  { key: 'picked_up', label: 'Diambil' },
  { key: 'expired', label: 'Kadaluarsa' },
];

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });
  const [activeTab, setActiveTab] = useState('all');

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

  const myBookings = useMemo(() => {
    if (!user?.email) return [];
    return bookings.filter(b => b.userEmail === user.email);
  }, [bookings, user]);

  const filteredBookings = useMemo(() => {
    if (activeTab === 'all') return myBookings;
    return myBookings.filter(b => b.status === activeTab);
  }, [myBookings, activeTab]);

  const counts = useMemo(() => {
    const c = { all: myBookings.length, pending: 0, approved: 0, picked_up: 0, expired: 0 };
    myBookings.forEach(b => { if (c[b.status] !== undefined) c[b.status]++; });
    return c;
  }, [myBookings]);

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
            Riwayat Booking
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1 leading-relaxed">
            Pantau semua pengajuan booking kamu di sini.
          </p>
        </div>

        {/* Summary */}
        <div className="px-5 pb-4">
          <div className="flex gap-2.5">
            <div className="flex-1 bg-gradient-to-br from-primary-500/5 to-transparent rounded-2xl p-3 border border-primary-500/10">
              <p className="text-[10px] text-[#64748B] font-medium uppercase tracking-wide">Total</p>
              <p className="text-lg font-bold text-primary-400 mt-0.5">{counts.all}</p>
            </div>
            <div className="flex-1 bg-gradient-to-br from-amber-500/5 to-transparent rounded-2xl p-3 border border-amber-500/10">
              <p className="text-[10px] text-[#64748B] font-medium uppercase tracking-wide">Pending</p>
              <p className="text-lg font-bold text-amber-400 mt-0.5">{counts.pending}</p>
            </div>
            <div className="flex-1 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl p-3 border border-emerald-500/10">
              <p className="text-[10px] text-[#64748B] font-medium uppercase tracking-wide">Diambil</p>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">{counts.picked_up}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 pb-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-1.5">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30'
                    : 'bg-dark-card text-[#64748B] border border-dark-border hover:text-[#94A3B8]'
                }`}
              >
                {tab.label}
                {counts[tab.key] > 0 && (
                  <span className="ml-1.5 text-[10px] opacity-60">({counts[tab.key]})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Booking List */}
        <div className="px-5 pb-6">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-3xl block mb-3 opacity-30">○</span>
              <p className="text-sm text-[#64748B]">
                {activeTab === 'all' ? 'Belum ada booking' : `Tidak ada booking ${TABS.find(t => t.key === activeTab)?.label.toLowerCase()}`}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredBookings.map(b => (
                <BookingCard key={b.id} booking={b} />
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
