'use client';

import { memo } from 'react';

function ItemGridCard({ item, onAddToCart, onRemoveFromCart, inCartQty = 0, isHabis, onDetail }) {
  const trulyAvailable = item.trulyAvailable ?? item.availableQty ?? 0;
  const outOfStock = isHabis || trulyAvailable <= 0;

  return (
    <div
      className={`rounded-2xl overflow-hidden active:scale-[0.97] transition-all duration-150 ${
        outOfStock && inCartQty === 0
          ? 'bg-dark-card/50 border border-dark-border opacity-60'
          : 'bg-dark-card border border-dark-border hover:border-primary-500/30'
      }`}
    >
      <div
        className={`aspect-square relative overflow-hidden ${
          outOfStock && inCartQty === 0 ? 'bg-dark-card-hover/50' : 'bg-dark-card-hover'
        }`}
        onClick={() => onDetail?.(item)}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark-card-hover to-dark-card">
            <svg className="w-12 h-12 text-dark-border-light/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
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
        <h3
          className={`font-medium text-sm leading-tight truncate ${
            outOfStock && inCartQty === 0 ? 'text-[#64748B]' : 'text-[#E2E8F0]'
          }`}
          onClick={() => onDetail?.(item)}
        >
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
                onClick={(e) => { e.stopPropagation(); onRemoveFromCart?.(item.id); }}
                className="w-8 h-8 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center active:scale-90 transition-all duration-150 border border-red-500/20 hover:bg-red-500/25"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                </svg>
              </button>
            )}
            {!outOfStock && (
              <button
                onClick={(e) => { e.stopPropagation(); onAddToCart?.({ ...item, trulyAvailable }, 1); }}
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

export default memo(ItemGridCard);
