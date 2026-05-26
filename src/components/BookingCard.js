'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { getDeadlineInfo } from '@/services/notificationService';

const STATUS_STYLES = {
  pending: 'chip-yellow',
  approved: 'chip-green',
  rejected: 'chip-red',
  picked_up: 'chip-blue',
  returned: 'chip-yellow',
  expired: 'chip-red',
};

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  picked_up: 'Sudah Diambil',
  returned: 'Dikembalikan',
  expired: 'Kadaluarsa',
};

function SwipeToConfirm({ onConfirm, label = 'Geser untuk konfirmasi' }) {
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [done, setDone] = useState(false);
  const containerRef = useRef(null);
  const maxDrag = useRef(200);

  const handleMove = useCallback((clientX) => {
    if (!dragging) return;
    const diff = clientX - startX;
    setOffsetX(Math.max(0, Math.min(diff, maxDrag.current)));
  }, [dragging, startX]);

  const handleEnd = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    if (offsetX > 100) {
      setDone(true);
      setOffsetX(maxDrag.current);
      setTimeout(() => onConfirm?.(), 300);
    } else {
      setOffsetX(0);
    }
  }, [dragging, offsetX, onConfirm]);

  // Global mouse tracking during drag
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => handleMove(e.clientX);
    const onUp = () => handleEnd();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, handleMove, handleEnd]);

  const handleTouchStart = (e) => {
    if (done) return;
    setDragging(true);
    setStartX(e.touches[0].clientX);
    setOffsetX(0);
  };

  const handleTouchMove = (e) => {
    if (!dragging || done) return;
    const diff = e.touches[0].clientX - startX;
    setOffsetX(Math.max(0, Math.min(diff, maxDrag.current)));
  };

  const handleTouchEnd = () => {
    if (!dragging) return;
    setDragging(false);
    if (offsetX > 100) {
      setDone(true);
      setOffsetX(maxDrag.current);
      setTimeout(() => onConfirm?.(), 300);
    } else {
      setOffsetX(0);
    }
  };

  const handleMouseDown = (e) => {
    if (done) return;
    e.preventDefault();
    setDragging(true);
    setStartX(e.clientX);
    setOffsetX(0);
  };

  const pct = maxDrag.current > 0 ? (offsetX / maxDrag.current) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`relative h-12 rounded-2xl overflow-hidden select-none ${
        done ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-dark-card-hover border border-dark-border'
      }`}
    >
      {/* Background label */}
      <div className="absolute inset-0 flex items-center justify-center text-xs text-[#64748B] font-medium">
        {done ? '✓ Sudah diambil' : (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-dark-border-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {label}
          </span>
        )}
      </div>

      {/* Draggable thumb */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-14 rounded-2xl flex items-center justify-center shadow-lg z-10 ${
          done ? 'bg-emerald-500 cursor-default' : 'bg-emerald-500 cursor-grab active:cursor-grabbing'
        }`}
        style={{
          transform: `translateX(${done ? maxDrag.current : offsetX}px)`,
          transition: dragging ? 'none' : 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Progress fill */}
      {dragging && pct > 5 && (
        <div
          className="absolute inset-y-0 left-0 rounded-2xl bg-emerald-500/10 transition-none"
          style={{ width: `${pct}%` }}
        />
      )}
    </div>
  );
}

export default function BookingCard({ booking, showAdmin = false, onApprove, onReject, onPickup, onReturn, actionBookingId }) {
  const deadline = booking.status === 'approved' && !booking.pickedUpAt ? getDeadlineInfo(booking.approvedAt) : null;
  const isApproved = booking.status === 'approved';
  const isPickedUp = booking.status === 'picked_up';
  const isExpired = booking.status === 'expired';

  return (
    <div className={`card-dark space-y-3 ${
      isExpired ? 'opacity-70' : ''
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isPickedUp ? 'bg-emerald-500/10' :
            isExpired ? 'bg-red-500/10' :
            isApproved ? 'bg-emerald-500/10' :
            booking.status === 'rejected' ? 'bg-red-500/10' :
            'bg-amber-500/10'
          }`}>
            <span className={`text-xs ${
              isPickedUp ? 'text-emerald-400' :
              isExpired ? 'text-red-400' :
              isApproved ? 'text-emerald-400' :
              booking.status === 'rejected' ? 'text-red-400' :
              'text-amber-400'
            }`}>
              {isPickedUp ? '✓' : isExpired ? '!' : isApproved ? '⏳' : booking.status === 'rejected' ? '✕' : '○'}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-[#E2E8F0] text-sm leading-tight truncate">
              {booking.itemName}
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              {booking.userName} &middot; {booking.qty} unit
            </p>
          </div>
        </div>
        <span className={STATUS_STYLES[booking.status] || 'chip'}>
          {STATUS_LABELS[booking.status] || booking.status}
        </span>
      </div>

      {deadline && (
        <div className={`text-xs px-3.5 py-2 rounded-xl font-medium ${
          deadline.level === 'critical' || deadline.level === 'overdue'
            ? 'bg-red-500/10 text-red-400'
            : deadline.level === 'urgent'
            ? 'bg-amber-500/10 text-amber-400'
            : 'bg-primary-500/10 text-primary-400'
        }`}>
          ⏰ {deadline.message}
        </div>
      )}

      {isApproved && !showAdmin && onPickup && (
        <div className="pt-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              Perlu diambil
            </span>
          </div>
          <SwipeToConfirm
            onConfirm={() => onPickup(booking.id)}
            label="Geser jika sudah diambil"
          />
        </div>
      )}

      {isApproved && !showAdmin && !onPickup && (
        <div className="pt-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Siap diambil
            </span>
          </div>
        </div>
      )}

      {isPickedUp && booking.pickedUpAt && (
        <div className="text-[11px] text-[#64748B] flex items-center gap-1.5">
          <span>✓ Diambil pada {new Date(booking.pickedUpAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )}

      {isExpired && (
        <div className="text-[11px] text-red-400/70 flex items-center gap-1.5">
          <span>! Booking kadaluarsa (tidak diambil dalam 3 hari)</span>
        </div>
      )}

      {showAdmin && booking.status === 'picked_up' && onReturn && (
        <div className="pt-1">
          <button
            onClick={(e) => { e.stopPropagation(); onReturn(booking.id); }}
            disabled={actionBookingId === booking.id}
            className="w-full text-xs font-semibold py-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 active:scale-95 transition-all duration-150 disabled:opacity-60"
          >
            {actionBookingId === booking.id ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Memproses...
              </span>
            ) : 'Kembalikan Barang'}
          </button>
        </div>
      )}

      {showAdmin && booking.status === 'pending' && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={(e) => { e.stopPropagation(); onApprove?.(booking.id); }}
            disabled={actionBookingId === booking.id}
            className="flex-1 text-xs font-semibold py-2.5 rounded-xl bg-emerald-500 text-white active:scale-95 transition-all duration-150 disabled:opacity-60"
          >
            {actionBookingId === booking.id ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Memproses...
              </span>
            ) : 'Setujui'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onReject?.(booking.id); }}
            disabled={actionBookingId === booking.id}
            className="flex-1 text-xs font-semibold py-2.5 rounded-xl bg-red-500 text-white active:scale-95 transition-all duration-150 disabled:opacity-60"
          >
            {actionBookingId === booking.id ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Memproses...
              </span>
            ) : 'Tolak'}
          </button>
        </div>
      )}
    </div>
  );
}
