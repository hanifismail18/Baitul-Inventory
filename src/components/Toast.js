'use client';

import { useEffect } from 'react';

const TYPE_STYLES = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-primary-500',
};

export default function Toast({ open, message, type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    if (!open || !duration) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] w-full max-w-xs px-4 animate-toast-in">
      <div className={`${TYPE_STYLES[type]} text-white text-sm font-semibold px-5 py-3.5 rounded-2xl shadow-xl text-center leading-relaxed`}>
        {message}
      </div>
    </div>
  );
}
