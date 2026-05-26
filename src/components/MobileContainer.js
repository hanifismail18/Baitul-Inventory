'use client';

export default function MobileContainer({ children }) {
  return (
    <div className="min-h-dvh flex items-start justify-center">
      <div className="w-full max-w-md min-h-dvh bg-dark-surface relative overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
