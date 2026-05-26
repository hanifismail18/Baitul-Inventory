'use client';

import { useRef, useCallback } from 'react';

export default function ItemGridCard({ item, onAddToCart, onRemoveFromCart, inCartQty = 0, isHabis }) {
  const clickTimeout = useRef(null);
  const trulyAvailable = item.trulyAvailable ?? item.availableQty ?? 0;
  const outOfStock = isHabis || trulyAvailable <= 0;

  const handleClick = useCallback(() => {
    if (outOfStock) return;
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      const qty = Math.min(2, trulyAvailable);
      onAddToCart?.({ ...item, trulyAvailable }, qty);
    } else {
      clickTimeout.current = setTimeout(() => {
        clickTimeout.current = null;
        onAddToCart?.({ ...item, trulyAvailable }, 1);
      }, 280);
    }
  }, [item, trulyAvailable, onAddToCart, outOfStock]);

  return (
    <div className={`rounded-2xl overflow-hidden active:scale-[0.97] transition-all duration-150 ${
      outOfStock && inCartQty === 0
        ? 'bg-dark-card/50 border border-dark-border opacity-60'
        : 'bg-dark-card border border-dark-border hover:border-primary-500/30'
    }`}>
      <div className={`aspect-square relative overflow-hidden ${
        outOfStock && inCartQty === 0 ? 'bg-dark-card-hover/50' : 'bg-dark-card-hover'
      }`}>
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-dark-border-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {outOfStock && inCartQty === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-xs font-bold text-white bg-red-500 px-3 py-1 rounded-full shadow-lg">
              HABIS
            </span>
          </div>
        )}
        {(!outOfStock || inCartQty > 0) && (
          <div className="absolute top-2 right-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              outOfStock
                ? 'text-amber-400 bg-amber-500/15 border-amber-500/20'
                : 'text-emerald-400 bg-emerald-500/15 border-emerald-500/20'
            }`}>
              {outOfStock ? 'Habis' : 'Stok'}
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className={`font-medium text-sm leading-tight truncate ${
          outOfStock && inCartQty === 0 ? 'text-[#64748B]' : 'text-[#E2E8F0]'
        }`}>
          {item.name}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs font-bold ${
            outOfStock && inCartQty === 0 ? 'text-red-400' : 'text-emerald-400'
          }`}>
            {outOfStock && inCartQty === 0 ? 'Stok habis' : `Sisa ${trulyAvailable}`}
          </span>
          <div className="flex items-center gap-1.5">
            {inCartQty > 0 && (
              <button
                onClick={() => onRemoveFromCart?.(item.id)}
                className="w-8 h-8 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center active:scale-90 transition-all duration-150 border border-red-500/20 hover:bg-red-500/25"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                </svg>
              </button>
            )}
            {!outOfStock && (
              <button
                onClick={handleClick}
                className="w-8 h-8 rounded-xl bg-primary-500 text-white flex items-center justify-center active:scale-90 transition-all duration-150 shadow-[0_2px_8px_rgba(99,102,241,0.3)] hover:bg-primary-400"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
        </div>
        {inCartQty > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full">
              Di keranjang: {inCartQty}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
