'use client';

import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, full, footer }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="overlay-modal" style={{ zIndex: 60 }}>
      <div className="backdrop animate-fade-in" onClick={onClose} />
      <div className={`sheet ${full ? 'max-h-[90vh]' : 'max-h-[85vh]'}`}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 rounded-full bg-dark-border-light" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 pt-2 pb-4">
            <h2 className="text-base font-bold text-[#E2E8F0] tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-dark-card border border-dark-border flex items-center justify-center text-[#64748B] active:scale-90 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className={`px-6 ${footer ? 'pb-0' : 'pb-6'}`}>{children}</div>

        {footer && (
          <div className="sticky bottom-0 bg-dark-surface border-t border-dark-border px-6 pt-3 pb-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
