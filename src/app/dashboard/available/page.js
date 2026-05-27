'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import ItemGridCard from '@/components/ItemGridCard';
import ItemDetailModal from '@/components/ItemDetailModal';
import { getItems, getBookings } from '@/services/dbService';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import Toast from '@/components/Toast';

export default function AvailablePage() {
  const { user } = useAuth();
  const { addItem: addToCart, items: cartItems, totalItems, removeItem, updateQty } = useCart();
  const [baseItems, setBaseItems] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ open: true, message, type });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsData, bookingsData] = await Promise.all([
          getItems(),
          getBookings(),
        ]);
        setBaseItems(itemsData);
        setBookings(bookingsData);
      } catch (err) {
        showToast('Gagal memuat data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showToast]);

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
    let result = baseItems.map(item => ({
      ...item,
      trulyAvailable: item.availableQty - (pendingQtys[item.id] || 0) - (cartQtys[item.id] || 0),
    })).sort((a, b) => a.name.localeCompare(b.name));

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(q));
    }
    return result;
  }, [baseItems, pendingQtys, cartQtys, search]);

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

      <div className="flex-1 pb-28">
        {/* Header */}
        <div className="px-5 pt-7 pb-4">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-[22px] font-bold text-white tracking-tight leading-tight">
              Ketersediaan Barang
            </h1>
          </div>
          <p className="text-sm text-[#94A3B8] mt-1 leading-relaxed">
            Cek stok barang yang tersedia, booking langsung, atau kelola keranjangmu.
          </p>
        </div>

        {/* Search */}
        <div className="px-5 pb-4">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-border-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari barang..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-dark-card border border-dark-border text-sm text-[#E2E8F0] outline-none focus:border-primary-500/50 transition-colors placeholder:text-[#475569]"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="px-5 pb-5">
          <div className="flex gap-2.5">
            <div className="flex-1 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl p-3 border border-emerald-500/10">
              <p className="text-[10px] text-[#64748B] font-medium uppercase tracking-wide">Tersedia</p>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">{allItems.filter(i => i.trulyAvailable > 0).length}</p>
            </div>
            <div className="flex-1 bg-gradient-to-br from-amber-500/5 to-transparent rounded-2xl p-3 border border-amber-500/10">
              <p className="text-[10px] text-[#64748B] font-medium uppercase tracking-wide">Habis</p>
              <p className="text-lg font-bold text-amber-400 mt-0.5">{allItems.filter(i => i.trulyAvailable <= 0).length}</p>
            </div>
            <div className="flex-1 bg-gradient-to-br from-primary-500/5 to-transparent rounded-2xl p-3 border border-primary-500/10">
              <p className="text-[10px] text-[#64748B] font-medium uppercase tracking-wide">Total</p>
              <p className="text-lg font-bold text-primary-400 mt-0.5">{allItems.length}</p>
            </div>
          </div>
        </div>

        {/* Items Grid */}
        <div className="px-5">
          {allItems.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-3xl block mb-3 opacity-30">◇</span>
              <p className="text-sm text-[#64748B]">
                {search ? 'Tidak ada barang yang cocok' : 'Belum ada barang tersedia'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {allItems.map(item => (
                <ItemGridCard
                  key={item.id}
                  item={item}
                  onAddToCart={handleAddToCart}
                  onRemoveFromCart={handleRemoveFromCart}
                  inCartQty={cartQtys[item.id] || 0}
                  isHabis={item.trulyAvailable <= 0}
                  onDetail={setSelectedItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* Item Detail Modal */}
        <ItemDetailModal
          open={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          item={selectedItem}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
          inCartQty={selectedItem ? (cartQtys[selectedItem.id] || 0) : 0}
        />

        {/* Cart indicator */}
        {totalItems > 0 && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-5 pb-6 pt-3 bg-gradient-to-t from-dark-surface via-dark-surface/95 to-transparent pointer-events-none">
            <Link
              href="/checkout"
              className="pointer-events-auto flex items-center justify-between bg-emerald-500/15 border border-emerald-500/30 rounded-2xl px-4 py-3.5 active:scale-[0.97] transition-all duration-150"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-300 leading-tight">Cek keranjang</p>
                  <p className="text-[11px] text-emerald-400/60">{totalItems} item</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-emerald-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
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
