'use client';

import { useState } from 'react';

export default function ItemCard({ item, onAddToCart }) {
  const [showQtyPicker, setShowQtyPicker] = useState(false);
  const [qty, setQty] = useState(1);
  const outOfStock = item.availableQty <= 0;

  const handleAdd = () => {
    onAddToCart?.(item, qty);
    setShowQtyPicker(false);
    setQty(1);
  };

  return (
    <div className="card-dark flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          outOfStock ? 'bg-red-500/10' : 'bg-primary-500/10'
        }`}>
          <span className={`text-sm ${outOfStock ? 'text-red-400' : 'text-primary-400'}`}>
            {outOfStock ? '○' : '◇'}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="font-medium text-[#E2E8F0] text-sm leading-tight truncate">
            {item.name}
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            {outOfStock ? 'Stok habis' : `${item.availableQty} tersedia`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          outOfStock
            ? 'bg-red-500/10 text-red-400'
            : 'bg-emerald-500/10 text-emerald-400'
        }`}>
          {outOfStock ? 'Habis' : item.availableQty}
        </span>

        {!outOfStock && !showQtyPicker && (
          <button
            onClick={() => setShowQtyPicker(true)}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-primary-500 text-white active:scale-95 transition-all duration-150"
          >
            + Keranjang
          </button>
        )}

        {showQtyPicker && (
          <div className="flex items-center gap-1.5 animate-fade-in">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="w-7 h-7 rounded-lg bg-dark-card-hover flex items-center justify-center text-xs text-[#94A3B8] active:scale-90"
            >
              −
            </button>
            <span className="text-sm font-semibold text-[#E2E8F0] w-5 text-center">{qty}</span>
            <button
              onClick={() => setQty(Math.min(item.availableQty, qty + 1))}
              className="w-7 h-7 rounded-lg bg-dark-card-hover flex items-center justify-center text-xs text-[#94A3B8] active:scale-90"
            >
              +
            </button>
            <button
              onClick={handleAdd}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-primary-500 text-white active:scale-95"
            >
              Tambah
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
