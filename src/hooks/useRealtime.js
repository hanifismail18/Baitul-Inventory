'use client';

import { useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/config/supabase';

export function useRealtime(table, callback) {
  const cb = useRef(callback);
  cb.current = callback;

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        cb.current?.();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [table]);
}
