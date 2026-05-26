import { db, isConfigured } from './firebase';
import {
  collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, Timestamp,
} from 'firebase/firestore';
import { initialItems } from '../data/initialItems';

const STORAGE_KEYS = {
  ITEMS: 'baitul_items',
  BOOKINGS: 'baitul_bookings',
  CONFIG: 'baitul_config',
};

const NPUNT_BASE = 'https://api.npoint.io';

let firestoreFailed = false;

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

const seedInitialData = () => {
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

const withTimeout = (promise, ms = 4000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Firestore timeout after ${ms}ms`)), ms)),
  ]);

const getNpointDocId = () => {
  const config = ls.get(STORAGE_KEYS.CONFIG) || {};
  return config.npointDocId;
};

const pushToNpoint = async () => {
  const docId = getNpointDocId();
  if (!docId) return;
  try {
    await fetch(`${NPUNT_BASE}/${docId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: ls.get(STORAGE_KEYS.ITEMS) || [],
        bookings: ls.get(STORAGE_KEYS.BOOKINGS) || [],
        config: ls.get(STORAGE_KEYS.CONFIG) || {},
      }),
    });
  } catch (e) {
    console.warn('npoint push failed:', e.message);
  }
};

const pullFromNpoint = async () => {
  const docId = getNpointDocId();
  if (!docId) return null;
  try {
    const res = await fetch(`${NPUNT_BASE}/${docId}`);
    if (!res.ok) throw new Error(`npoint: ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('npoint pull failed:', e.message);
    return null;
  }
};

// ─── ITEMS ────────────────────────────────────────────────────────────────────

export const addItem = async (name, totalQty, imageUrl = null) => {
  const itemData = {
    name,
    totalQty: Number(totalQty),
    availableQty: Number(totalQty),
    imageUrl,
  };
  if (isConfigured() && !firestoreFailed) {
    try {
      const docRef = await withTimeout(addDoc(collection(db, 'items'), {
        ...itemData,
        createdAt: Timestamp.now(),
      }));
      return { id: docRef.id, ...itemData };
    } catch (e) {
      firestoreFailed = true;
      if (typeof window !== 'undefined') {
        console.warn('Firestore addItem failed, using localStorage fallback:', e.message);
      }
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
  await pushToNpoint();
  return newItem;
};

export const updateItem = async (id, updates) => {
  if (isConfigured() && !firestoreFailed) {
    try {
      await withTimeout(updateDoc(doc(db, 'items', id), updates));
      return { id, ...updates };
    } catch (e) {
      firestoreFailed = true;
      if (typeof window !== 'undefined') {
        console.warn('Firestore updateItem failed, using localStorage fallback:', e.message);
      }
    }
  }
  const items = ls.get(STORAGE_KEYS.ITEMS) || [];
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) throw new Error('Item not found');
  items[idx] = { ...items[idx], ...updates };
  ls.set(STORAGE_KEYS.ITEMS, items);
  await pushToNpoint();
  return items[idx];
};

export const deleteItem = async (id) => {
  if (isConfigured() && !firestoreFailed) {
    try {
      await withTimeout(deleteDoc(doc(db, 'items', id)));
      return;
    } catch (e) {
      firestoreFailed = true;
      if (typeof window !== 'undefined') {
        console.warn('Firestore deleteItem failed, using localStorage fallback:', e.message);
      }
    }
  }
  const items = ls.get(STORAGE_KEYS.ITEMS) || [];
  ls.set(STORAGE_KEYS.ITEMS, items.filter(i => i.id !== id));
  await pushToNpoint();
};

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────

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

export const getBookings = async () => {
  if (isConfigured() && !firestoreFailed) {
    try {
      const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
      const snap = await withTimeout(getDocs(q));
      const bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return bookings;
    } catch (e) {
      firestoreFailed = true;
      if (typeof window !== 'undefined') {
        console.warn('Firestore getBookings failed, using localStorage fallback:', e.message);
      }
    }
  }
  // try npoint sync
  const npointData = await pullFromNpoint();
  if (npointData && npointData.bookings) {
    ls.set(STORAGE_KEYS.BOOKINGS, npointData.bookings);
    ls.set(STORAGE_KEYS.ITEMS, npointData.items || []);
    ls.set(STORAGE_KEYS.CONFIG, npointData.config || {});
  }
  const bookings = ls.get(STORAGE_KEYS.BOOKINGS) || [];
  const items = ls.get(STORAGE_KEYS.ITEMS) || [];
  autoExpirePickups(bookings, items);
  return bookings;
};

export const getItems = async () => {
  if (isConfigured() && !firestoreFailed) {
    try {
      const q = query(collection(db, 'items'), orderBy('name'));
      const snap = await withTimeout(getDocs(q));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      firestoreFailed = true;
      if (typeof window !== 'undefined') {
        console.warn('Firestore getItems failed, using localStorage fallback:', e.message);
      }
    }
  }
  // try npoint sync
  const npointData = await pullFromNpoint();
  if (npointData && npointData.items) {
    ls.set(STORAGE_KEYS.ITEMS, npointData.items);
    ls.set(STORAGE_KEYS.BOOKINGS, npointData.bookings || []);
    ls.set(STORAGE_KEYS.CONFIG, npointData.config || {});
  }
  const bookings = ls.get(STORAGE_KEYS.BOOKINGS) || [];
  const items = ls.get(STORAGE_KEYS.ITEMS) || [];
  autoExpirePickups(bookings, items);
  return items;
};

export const addBooking = async (bookingData) => {
  const data = {
    ...bookingData,
    status: 'pending',
    approvedAt: null,
    pickedUpAt: null,
    notifiedDay1: false,
    notifiedDay2: false,
    notifiedDay3: false,
  };
  if (isConfigured() && !firestoreFailed) {
    try {
      const docRef = await withTimeout(addDoc(collection(db, 'bookings'), {
        ...data,
        createdAt: Timestamp.now(),
      }));
      return { id: docRef.id, ...data };
    } catch (e) {
      firestoreFailed = true;
      if (typeof window !== 'undefined') {
        console.warn('Firestore addBooking failed, using localStorage fallback:', e.message);
      }
    }
  }
  const bookings = ls.get(STORAGE_KEYS.BOOKINGS) || [];
  const newBooking = {
    ...data,
    id: `booking_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  bookings.unshift(newBooking);
  ls.set(STORAGE_KEYS.BOOKINGS, bookings);
  await pushToNpoint();
  return newBooking;
};

export const approveBooking = async (bookingId) => {
  let booking, item, items, bookings;
  const firestoreOk = { value: true };

  if (isConfigured() && !firestoreFailed) {
    try {
      const snap = await withTimeout(getDocs(collection(db, 'bookings')));
      booking = snap.docs.map(d => ({ id: d.id, ...d.data() })).find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');

      const itemSnap = await withTimeout(getDocs(collection(db, 'items')));
      items = itemSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      item = items.find(i => i.id === booking.itemId);
    } catch (e) {
      firestoreFailed = true;
      if (typeof window !== 'undefined') {
        console.warn('Firestore approveBooking (read) failed, using localStorage fallback:', e.message);
      }
      firestoreOk.value = false;
    }
  }

  if (!firestoreOk.value || !isConfigured() || firestoreFailed) {
    bookings = ls.get(STORAGE_KEYS.BOOKINGS) || [];
    booking = bookings.find(b => b.id === bookingId);

    items = ls.get(STORAGE_KEYS.ITEMS) || [];
    item = items.find(i => i.id === booking.itemId);
  }

  if (!item) throw new Error('Item not found');
  if (item.availableQty < booking.qty) throw new Error('Insufficient stock');

  const now = firestoreOk.value && isConfigured() ? Timestamp.now() : new Date().toISOString();

  if (isConfigured() && !firestoreFailed && firestoreOk.value) {
    try {
      await withTimeout(updateDoc(doc(db, 'bookings', bookingId), { status: 'approved', approvedAt: now }));
      await withTimeout(updateDoc(doc(db, 'items', booking.itemId), { availableQty: item.availableQty - booking.qty }));
      return true;
    } catch (e) {
      firestoreFailed = true;
      if (typeof window !== 'undefined') {
        console.warn('Firestore approveBooking (write) failed, using localStorage fallback:', e.message);
      }
    }
  }

  const bIdx = bookings.findIndex(b => b.id === bookingId);
  bookings[bIdx].status = 'approved';
  bookings[bIdx].approvedAt = now;
  ls.set(STORAGE_KEYS.BOOKINGS, bookings);

  const iIdx = items.findIndex(i => i.id === booking.itemId);
  items[iIdx].availableQty = item.availableQty - booking.qty;
  ls.set(STORAGE_KEYS.ITEMS, items);

  await pushToNpoint();
  return true;
};

export const rejectBooking = async (bookingId) => {
  if (isConfigured() && !firestoreFailed) {
    try {
      await withTimeout(updateDoc(doc(db, 'bookings', bookingId), { status: 'rejected' }));
      return;
    } catch (e) {
      firestoreFailed = true;
      if (typeof window !== 'undefined') {
        console.warn('Firestore rejectBooking failed, using localStorage fallback:', e.message);
      }
    }
  }
  const bookings = ls.get(STORAGE_KEYS.BOOKINGS) || [];
  const idx = bookings.findIndex(b => b.id === bookingId);
  if (idx === -1) throw new Error('Booking not found');
  bookings[idx].status = 'rejected';
  ls.set(STORAGE_KEYS.BOOKINGS, bookings);
  await pushToNpoint();
};

export const pickupBooking = async (bookingId) => {
  if (isConfigured() && !firestoreFailed) {
    try {
      await withTimeout(updateDoc(doc(db, 'bookings', bookingId), {
        status: 'picked_up',
        pickedUpAt: Timestamp.now(),
      }));
      return true;
    } catch (e) {
      firestoreFailed = true;
      if (typeof window !== 'undefined') {
        console.warn('Firestore pickupBooking failed, using localStorage fallback:', e.message);
      }
    }
  }
  const bookings = ls.get(STORAGE_KEYS.BOOKINGS) || [];
  const idx = bookings.findIndex(b => b.id === bookingId);
  if (idx === -1) throw new Error('Booking not found');
  bookings[idx].status = 'picked_up';
  bookings[idx].pickedUpAt = new Date().toISOString();
  ls.set(STORAGE_KEYS.BOOKINGS, bookings);
  await pushToNpoint();
  return true;
};

export const returnBooking = async (bookingId) => {
  if (isConfigured() && !firestoreFailed) {
    try {
      const snap = await withTimeout(getDocs(collection(db, 'bookings')));
      const booking = snap.docs.map(d => ({ id: d.id, ...d.data() })).find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');
      if (booking.status !== 'picked_up') throw new Error('Only picked-up bookings can be returned');

      await withTimeout(updateDoc(doc(db, 'bookings', bookingId), { status: 'returned', returnedAt: Timestamp.now() }));
      const itemSnap = await withTimeout(getDoc(doc(db, 'items', booking.itemId)));
      if (itemSnap.exists()) {
        const item = itemSnap.data();
        await withTimeout(updateDoc(doc(db, 'items', booking.itemId), { availableQty: (item.availableQty || 0) + booking.qty }));
      }
      return true;
    } catch (e) {
      firestoreFailed = true;
      if (typeof window !== 'undefined') {
        console.warn('Firestore returnBooking failed, using localStorage fallback:', e.message);
      }
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
  await pushToNpoint();
  return true;
};

const DEFAULT_CONFIG = {
  welcomeHeading: 'Halo!',
  welcomeSubtitle: 'Mau ambil atau cek barang inventaris? Silakan cek ketersediaan barang atau lihat status booking kamu di bawah ini, ya.',
  cloudinaryCloudName: '',
  cloudinaryUploadPreset: '',
  npointDocId: '',
};

export const getConfig = () => {
  if (typeof window === 'undefined') return { ...DEFAULT_CONFIG };
  const saved = ls.get(STORAGE_KEYS.CONFIG);
  return { ...DEFAULT_CONFIG, ...saved };
};

export const saveConfig = async (updates) => {
  if (typeof window === 'undefined') return;
  const current = ls.get(STORAGE_KEYS.CONFIG) || {};
  ls.set(STORAGE_KEYS.CONFIG, { ...current, ...updates });
  await pushToNpoint();
};
