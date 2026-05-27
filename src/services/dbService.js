import {
  getItems as supabaseGetItems,
  addItem as supabaseAddItem,
  updateItem as supabaseUpdateItem,
  seedItems as supabaseSeedItems,
  getBookings as supabaseGetBookings,
  addBooking as supabaseAddBooking,
  updateBooking as supabaseUpdateBooking,
  getItemById as supabaseGetItemById,
  saveConfig as supabaseSaveConfig,
} from './supabaseService';
import { supabase, isSupabaseConfigured } from '@/config/supabase';
import { initialItems } from '../data/initialItems';

const STORAGE_KEYS = {
  ITEMS: 'baitul_items',
  BOOKINGS: 'baitul_bookings',
  CONFIG: 'baitul_config',
};

const ls = {
  get(key) {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },
  set(key, value) {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
};

const seedInitialData = async () => {
  if (isSupabaseConfigured()) {
    try {
      const result = await supabaseSeedItems(initialItems.map((item, idx) => ({
        ...item,
        id: `item_${idx}`,
        createdAt: new Date().toISOString(),
      })));
      if (result.seeded) {
        console.log(`supabase: seeded ${result.count} items`);
      }
    } catch (e) {
      console.warn('supabase: seed failed, using localStorage fallback', e.message);
      seedLocalFallback();
    }
  } else {
    seedLocalFallback();
  }
};

const seedLocalFallback = () => {
  const items = ls.get(STORAGE_KEYS.ITEMS);
  if (!items || items.length === 0) {
    ls.set(STORAGE_KEYS.ITEMS, initialItems.map((item, idx) => ({
      ...item,
      id: `item_${idx}`,
      createdAt: new Date().toISOString(),
    })));
  }
  if (!ls.get(STORAGE_KEYS.BOOKINGS)) {
    ls.set(STORAGE_KEYS.BOOKINGS, []);
  }
};

if (typeof window !== 'undefined') {
  seedInitialData();
}

// ─── THREE DAY EXPIRY ───────────────────────────────────────────

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

const autoExpirePickups = (bookings, items) => {
  const now = Date.now();
  let changed = false;
  bookings.forEach(b => {
    if (b.status === 'approved' && !b.pickedUpAt && b.approvedAt) {
      const approvedTime = new Date(b.approvedAt).getTime();
      if (now - approvedTime > THREE_DAYS_MS) {
        b.status = 'expired';
        b.expiredAt = new Date().toISOString();
        changed = true;
        const item = items.find(i => i.id === b.itemId);
        if (item) {
          item.availableQty = (item.availableQty || 0) + b.qty;
        }
      }
    }
  });
  if (changed) {
    ls.set(STORAGE_KEYS.BOOKINGS, bookings);
    ls.set(STORAGE_KEYS.ITEMS, items);
  }
  return { bookings, items };
};

// ─── ITEMS ──────────────────────────────────────────────────────

export const addItem = async (name, totalQty, imageUrl = null) => {
  const itemData = { name, totalQty: Number(totalQty), availableQty: Number(totalQty), imageUrl };
  if (isSupabaseConfigured()) {
    try {
      return await supabaseAddItem(name, totalQty, imageUrl);
    } catch (e) {
      console.warn('supabase addItem failed, using localStorage:', e.message);
    }
  }
  const items = ls.get(STORAGE_KEYS.ITEMS) || [];
  const newItem = {
    ...itemData,
    id: `item_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  items.push(newItem);
  ls.set(STORAGE_KEYS.ITEMS, items);
  return newItem;
};

export const updateItem = async (id, updates) => {
  if (isSupabaseConfigured()) {
    try {
      return await supabaseUpdateItem(id, updates);
    } catch (e) {
      console.warn('supabase updateItem failed, using localStorage:', e.message);
    }
  }
  const items = ls.get(STORAGE_KEYS.ITEMS) || [];
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) throw new Error('Item not found');
  items[idx] = { ...items[idx], ...updates };
  ls.set(STORAGE_KEYS.ITEMS, items);
  return items[idx];
};

export const deleteItem = async (id) => {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('items').delete().eq('id', id);
      return;
    } catch (e) {
      console.warn('supabase deleteItem failed, using localStorage:', e.message);
    }
  }
  const items = ls.get(STORAGE_KEYS.ITEMS) || [];
  ls.set(STORAGE_KEYS.ITEMS, items.filter(i => i.id !== id));
};

// ─── BOOKINGS ──────────────────────────────────────────────────

export const getBookings = async () => {
  if (isSupabaseConfigured()) {
    try {
      const supabaseData = await supabaseGetBookings();
      ls.set(STORAGE_KEYS.BOOKINGS, supabaseData);
      ls.set(STORAGE_KEYS.ITEMS, await supabaseGetItems());
      return supabaseData;
    } catch (e) {
      console.warn('supabase getBookings failed, using localStorage:', e.message);
    }
  }
  const bookings = ls.get(STORAGE_KEYS.BOOKINGS) || [];
  const items = ls.get(STORAGE_KEYS.ITEMS) || [];
  autoExpirePickups(bookings, items);
  return bookings;
};

export const getItems = async () => {
  if (isSupabaseConfigured()) {
    try {
      const data = await supabaseGetItems();
      ls.set(STORAGE_KEYS.ITEMS, data);
      return data;
    } catch (e) {
      console.warn('supabase getItems failed, using localStorage:', e.message);
    }
  }
  const items = ls.get(STORAGE_KEYS.ITEMS) || [];
  const bookings = ls.get(STORAGE_KEYS.BOOKINGS) || [];
  autoExpirePickups(bookings, items);
  return items;
};

export const addBooking = async (bookingData) => {
  if (isSupabaseConfigured()) {
    try {
      return await supabaseAddBooking(bookingData);
    } catch (e) {
      console.warn('supabase addBooking failed, using localStorage:', e.message);
    }
  }
  const bookings = ls.get(STORAGE_KEYS.BOOKINGS) || [];
  const newBooking = {
    ...bookingData,
    id: `booking_${Date.now()}`,
    status: 'pending',
    approvedAt: null,
    pickedUpAt: null,
    returnedAt: null,
    expiredAt: null,
    notifiedDay1: false,
    notifiedDay2: false,
    notifiedDay3: false,
    createdAt: new Date().toISOString(),
  };
  bookings.unshift(newBooking);
  ls.set(STORAGE_KEYS.BOOKINGS, bookings);
  return newBooking;
};

export const approveBooking = async (bookingId) => {
  const firestoreOk = { value: true };

  if (isSupabaseConfigured()) {
    try {
      const bookings = await supabaseGetBookings();
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');
      const items = await supabaseGetItems();
      const item = items.find(i => i.id === booking.itemId);
      if (!item) throw new Error('Item not found');
      if (item.availableQty < booking.qty) throw new Error('Insufficient stock');

      await supabaseUpdateBooking(bookingId, {
        status: 'approved',
        approvedAt: new Date().toISOString(),
      });
      const newQty = item.availableQty - booking.qty;
      await supabaseUpdateItem(item.id, { availableQty: newQty });
      return true;
    } catch (e) {
      if (e.message === 'Booking not found' || e.message === 'Item not found' || e.message === 'Insufficient stock') {
        throw e;
      }
      console.warn('supabase approveBooking failed, using localStorage:', e.message);
      firestoreOk.value = false;
    }
  }

  const bookings = ls.get(STORAGE_KEYS.BOOKINGS) || [];
  const booking = bookings.find(b => b.id === bookingId);
  const items = ls.get(STORAGE_KEYS.ITEMS) || [];
  const item = items.find(i => i.id === booking.itemId);
  if (!item) throw new Error('Item not found');
  if (item.availableQty < booking.qty) throw new Error('Insufficient stock');

  const bIdx = bookings.findIndex(b => b.id === bookingId);
  bookings[bIdx].status = 'approved';
  bookings[bIdx].approvedAt = new Date().toISOString();
  ls.set(STORAGE_KEYS.BOOKINGS, bookings);

  const iIdx = items.findIndex(i => i.id === booking.itemId);
  items[iIdx].availableQty = item.availableQty - booking.qty;
  ls.set(STORAGE_KEYS.ITEMS, items);
  return true;
};

export const rejectBooking = async (bookingId) => {
  if (isSupabaseConfigured()) {
    try {
      await supabaseUpdateBooking(bookingId, { status: 'rejected' });
      return;
    } catch (e) {
      console.warn('supabase rejectBooking failed, using localStorage:', e.message);
    }
  }
  const bookings = ls.get(STORAGE_KEYS.BOOKINGS) || [];
  const idx = bookings.findIndex(b => b.id === bookingId);
  if (idx === -1) throw new Error('Booking not found');
  bookings[idx].status = 'rejected';
  ls.set(STORAGE_KEYS.BOOKINGS, bookings);
};

export const pickupBooking = async (bookingId) => {
  if (isSupabaseConfigured()) {
    try {
      await supabaseUpdateBooking(bookingId, {
        status: 'picked_up',
        pickedUpAt: new Date().toISOString(),
      });
      return true;
    } catch (e) {
      console.warn('supabase pickupBooking failed, using localStorage:', e.message);
    }
  }
  const bookings = ls.get(STORAGE_KEYS.BOOKINGS) || [];
  const idx = bookings.findIndex(b => b.id === bookingId);
  if (idx === -1) throw new Error('Booking not found');
  bookings[idx].status = 'picked_up';
  bookings[idx].pickedUpAt = new Date().toISOString();
  ls.set(STORAGE_KEYS.BOOKINGS, bookings);
  return true;
};

export const returnBooking = async (bookingId) => {
  if (isSupabaseConfigured()) {
    try {
      const bookings = await supabaseGetBookings();
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');
      if (booking.status !== 'picked_up') throw new Error('Only picked-up bookings can be returned');

      await supabaseUpdateBooking(bookingId, {
        status: 'returned',
        returnedAt: new Date().toISOString(),
      });
      const item = await supabaseGetItemById(booking.itemId);
      if (item) {
        const newQty = (item.availableQty || 0) + booking.qty;
        await supabaseUpdateItem(booking.itemId, { availableQty: newQty });
      }
      return true;
    } catch (e) {
      if (e.message === 'Booking not found' || e.message === 'Only picked-up bookings can be returned') {
        throw e;
      }
      console.warn('supabase returnBooking failed, using localStorage:', e.message);
    }
  }
  const bookings = ls.get(STORAGE_KEYS.BOOKINGS) || [];
  const bIdx = bookings.findIndex(b => b.id === bookingId);
  if (bIdx === -1) throw new Error('Booking not found');
  const booking = bookings[bIdx];
  if (booking.status !== 'picked_up') throw new Error('Only picked-up bookings can be returned');
  booking.status = 'returned';
  booking.returnedAt = new Date().toISOString();
  ls.set(STORAGE_KEYS.BOOKINGS, bookings);

  const items = ls.get(STORAGE_KEYS.ITEMS) || [];
  const iIdx = items.findIndex(i => i.id === booking.itemId);
  if (iIdx !== -1) {
    items[iIdx].availableQty = (items[iIdx].availableQty || 0) + booking.qty;
    ls.set(STORAGE_KEYS.ITEMS, items);
  }
  return true;
};

// ─── CONFIG ─────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
  welcomeHeading: 'Halo!',
  welcomeSubtitle: 'Mau ambil atau cek barang inventaris? Silakan cek ketersediaan barang atau lihat status booking kamu di bawah ini, ya.',
};

export const getConfig = () => {
  if (typeof window === 'undefined') return { ...DEFAULT_CONFIG };
  const saved = ls.get(STORAGE_KEYS.CONFIG);
  return { ...DEFAULT_CONFIG, ...saved };
};

export const saveConfig = async (updates) => {
  if (isSupabaseConfigured()) {
    try {
      await supabaseSaveConfig(updates);
    } catch (e) {
      console.warn('supabase saveConfig failed, using localStorage:', e.message);
    }
  }
  if (typeof window === 'undefined') return;
  const current = ls.get(STORAGE_KEYS.CONFIG) || {};
  ls.set(STORAGE_KEYS.CONFIG, { ...current, ...updates });
};
