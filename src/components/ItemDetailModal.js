'use client';

import { useEffect, useRef, useState } from 'react';

export default function ItemDetailModal({ open, onClose, item, onAddToCart, onRemoveFromCart, inCartQty = 0 }) {
  const [closing, setClosing] = useState(false);
  const prevOpen = useRef(open);
  const trulyAvailable = item?.trulyAvailable ?? item?.availableQty ?? 0;
  const outOfStock = trulyAvailable <= 0;

  useEffect(() => {
    if (open && !prevOpen.current) {
      document.body.style.overflow = 'hidden';
    } else if (!open && prevOpen.current) {
      setClosing(true);
      setTimeout(() => {
        setClosing(false);
        document.body.style.overflow = '';
      }, 300);
    }
    prevOpen.current = open;
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open && !closing) return null;
  if (!item) return null;

  return (
    <div className="overlay-modal" style={{ zIndex: 60 }}>
      <div
        className={`backdrop ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}
        onClick={closing ? undefined : onClose}
      />

      <div className={`relative bg-dark-surface w-full max-w-md rounded-t-3xl overflow-hidden flex flex-col ${closing ? 'animate-sheet-down' : 'animate-sheet-up'}`}
        style={{ maxHeight: '94vh' }}
      >
        {/* Handle */}
        <div className="absolute top-0 left-0 right-0 z-20 flex justify-center pt-3">
          <div className="w-8 h-1 rounded-full bg-dark-border-light" />
        </div>

        {/* Image */}
        <div className="relative w-full aspect-square bg-dark-card-hover shrink-0">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark-card-hover to-dark-card">
              <svg className="w-20 h-20 text-dark-border-light/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-dark-surface via-dark-surface/50 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center active:scale-90 transition-all border border-white/10"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Stock badge */}
          <div className="absolute top-4 left-4 z-20">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              outOfStock
                ? 'text-red-400 bg-red-500/20 border-red-500/30'
                : 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
            }`}>
              {outOfStock ? 'Habis' : 'Tersedia'}
            </span>
          </div>

          {/* Name overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-5">
            <h2 className="text-xl font-bold text-white drop-shadow-lg leading-tight">
              {item.name}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pt-4 pb-4 overflow-y-auto">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 text-sm font-bold ${
              outOfStock ? 'text-red-400' : 'text-emerald-400'
            }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25 3.75-4.5" />
              </svg>
              Sisa {trulyAvailable}
            </div>
            {inCartQty > 0 && (
              <div className="flex items-center gap-1.5 text-sm font-medium text-primary-400 bg-primary-500/10 px-3 py-1 rounded-full">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
                {inCartQty} di keranjang
              </div>
            )}
          </div>

          {outOfStock && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
              <p className="text-sm text-red-400/80">Stok barang ini sedang habis. Silakan cek kembali nanti.</p>
            </div>
          )}
        </div>

        {/* Bottom action bar */}
        <div className="shrink-0 px-6 pb-6 pt-3 bg-dark-surface border-t border-dark-border">
          {outOfStock && inCartQty === 0 ? (
            <button
              disabled
              className="w-full py-3.5 rounded-2xl bg-dark-card text-[#64748B] text-sm font-bold border border-dark-border cursor-not-allowed"
            >
              Stok Habis
            </button>
          ) : inCartQty > 0 ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onRemoveFromCart?.(item.id)}
                  className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center active:scale-90 transition-all border border-red-500/20 hover:bg-red-500/25"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                  </svg>
                </button>
                <span className="text-lg font-bold text-[#E2E8F0] min-w-[2ch] text-center tabular-nums">{inCartQty}</span>
                <button
                  onClick={() => onAddToCart?.({ ...item, trulyAvailable }, 1)}
                  disabled={inCartQty >= trulyAvailable}
                  className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center active:scale-90 transition-all shadow-[0_2px_8px_rgba(99,102,241,0.3)] hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-medium tabular-nums">
                Sisa {trulyAvailable - inCartQty}
              </span>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart?.({ ...item, trulyAvailable }, 1)}
              className="w-full py-3.5 rounded-2xl bg-primary-500 text-white text-sm font-bold active:scale-[0.97] transition-all shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:bg-primary-400"
            >
              Tambah ke Keranjang
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
