'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import {
  getItems, getBookings, addItem, updateItem, deleteItem,
  approveBooking, rejectBooking, returnBooking,
  getConfig, saveConfig,
} from '@/services/dbService';
import { captureFromCamera, pickFromGallery, uploadToSupabaseStorage } from '@/services/imageUploadService';
import { onBookingStatusChanged } from '@/services/notificationService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import BookingCard from '@/components/BookingCard';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';

const ADMIN_TABS = [
  { key: 'bookings', label: 'Pengajuan' },
  { key: 'items', label: 'Daftar Barang' },
  { key: 'settings', label: 'Pengaturan' },
];

export default function AdminPage() {
  const { admin, adminReady } = useAdmin();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('bookings');
  const [items, setItems] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });

  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formName, setFormName] = useState('');
  const [formQty, setFormQty] = useState('');
  const [formImage, setFormImage] = useState(null);

  const [batchMode, setBatchMode] = useState(false);
  const [draftItems, setDraftItems] = useState({});
  const [batchSaving, setBatchSaving] = useState(false);

  const [config, setConfig] = useState({ welcomeHeading: '', welcomeSubtitle: '' });
  const [configSupabaseSynced, setConfigSupabaseSynced] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);

  const [actionBookingId, setActionBookingId] = useState(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null);
  const [confirmReturnBooking, setConfirmReturnBooking] = useState(null);
  const [itemActionLoading, setItemActionLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ open: true, message, type });
  }, []);

  useEffect(() => {
    if (!adminReady) return;
    if (!admin) { router.replace('/admin/login'); return; }
    loadData();
  }, [admin, adminReady, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsData, bookingsData] = await Promise.all([getItems(), getBookings()]);
      setItems(itemsData);
      setBookings(bookingsData);
      setConfig(await getConfig());
    } catch { showToast('Gagal memuat data', 'error'); }
    finally { setLoading(false); }
  };

  const handleApprove = async (bookingId) => {
    setActionBookingId(bookingId);
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) { setActionBookingId(null); return; }
    try {
      await approveBooking(bookingId);
      await onBookingStatusChanged(booking, booking.userEmail, 'approved');
      showToast('Pengajuan disetujui!', 'success');
      loadData();
    } catch (err) { showToast(err.message || 'Gagal menyetujui', 'error'); }
    finally { setActionBookingId(null); }
  };

  const handleReject = async (bookingId) => {
    setActionBookingId(bookingId);
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) { setActionBookingId(null); return; }
    try {
      await rejectBooking(bookingId);
      await onBookingStatusChanged(booking, booking.userEmail, 'rejected');
      showToast('Pengajuan ditolak', 'info');
      loadData();
    } catch { showToast('Gagal menolak', 'error'); }
    finally { setActionBookingId(null); }
  };

  const handleReturn = (bookingId) => {
    setConfirmReturnBooking(bookingId);
  };

  const confirmReturn = async () => {
    const bookingId = confirmReturnBooking;
    if (!bookingId) return;
    setActionBookingId(bookingId);
    setConfirmReturnBooking(null);
    try {
      await returnBooking(bookingId);
      showToast('Barang berhasil dikembalikan ke stok!', 'success');
      loadData();
    } catch { showToast('Gagal mengembalikan barang', 'error'); }
    finally { setActionBookingId(null); }
  };

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    try {
      await saveConfig({
        welcomeHeading: config.welcomeHeading.trim(),
        welcomeSubtitle: config.welcomeSubtitle.trim(),
      });
      showToast('Pengaturan berhasil disimpan!', 'success');
    } catch { showToast('Gagal menyimpan pengaturan', 'error'); }
    finally { setConfigSaving(false); }
  };

  const handleImagePick = async (capture) => {
    try {
      const result = capture ? await captureFromCamera() : await pickFromGallery();
      setFormImage(result.dataUrl);
    } catch (err) {
      showToast(err.message, 'warning');
    }
  };

  const handleAddItem = async () => {
    if (!formName.trim() || !formQty || Number(formQty) < 1) {
      showToast('Nama dan Qty harus diisi dengan benar', 'warning');
      return;
    }
    setFormSubmitting(true);
    try {
      const imageUrl = formImage
        ? await uploadToSupabaseStorage(formImage)
        : null;
      await addItem(formName.trim(), Number(formQty), imageUrl);
      showToast('Barang berhasil ditambahkan', 'success');
      setAddModal(false); setFormName(''); setFormQty(''); setFormImage(null);
      loadData();
    } catch { showToast('Gagal menambah barang', 'error'); }
    finally { setFormSubmitting(false); }
  };

  const handleEditItem = async () => {
    if (!formName.trim() || !formQty || Number(formQty) < 1) {
      showToast('Nama dan Qty harus diisi dengan benar', 'warning');
      return;
    }
    setFormSubmitting(true);
    try {
      const diff = Number(formQty) - editItem.totalQty;
      const updates = {
        name: formName.trim(),
        totalQty: Number(formQty),
        availableQty: editItem.availableQty + diff,
      };
      if (formImage) updates.imageUrl = await uploadToSupabaseStorage(formImage);
      await updateItem(editItem.id, updates);
      showToast('Barang berhasil diperbarui', 'success');
      setEditModal(false); setEditItem(null); setFormName(''); setFormQty(''); setFormImage(null);
      loadData();
    } catch { showToast('Gagal mengubah barang', 'error'); }
    finally { setFormSubmitting(false); }
  };

  const handleDeleteItem = async () => {
    const itemId = confirmDeleteItem;
    if (!itemId) return;
    setItemActionLoading(true);
    setConfirmDeleteItem(null);
    try { await deleteItem(itemId); showToast('Barang berhasil dihapus', 'success'); loadData(); }
    catch { showToast('Gagal menghapus barang', 'error'); }
    finally { setItemActionLoading(false); }
  };

  const openEditModal = (item) => {
    setEditItem(item); setFormName(item.name); setFormQty(String(item.totalQty)); setFormImage(null);
    setEditModal(true);
  };

  const enterBatchMode = () => {
    const drafts = {};
    items.forEach(item => {
      drafts[item.id] = { name: item.name, totalQty: item.totalQty };
    });
    setDraftItems(drafts);
    setBatchMode(true);
  };

  const cancelBatchMode = () => {
    setBatchMode(false);
    setDraftItems({});
  };

  const updateDraft = (id, field, value) => {
    setDraftItems(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: field === 'totalQty' ? Number(value) : value },
    }));
  };

  const handleBatchSave = async () => {
    setBatchSaving(true);
    let changed = 0;
    try {
      for (const [id, draft] of Object.entries(draftItems)) {
        const original = items.find(i => i.id === id);
        if (!original) continue;
        const nameChanged = original.name !== draft.name;
        const qtyChanged = original.totalQty !== draft.totalQty;
        if (!nameChanged && !qtyChanged) continue;
        const diff = Number(draft.totalQty) - original.totalQty;
        await updateItem(id, {
          name: draft.name,
          totalQty: Number(draft.totalQty),
          availableQty: original.availableQty + diff,
        });
        changed++;
      }
      showToast(`${changed} barang berhasil diperbarui`, 'success');
      setBatchMode(false);
      setDraftItems({});
      loadData();
    } catch { showToast('Gagal menyimpan perubahan', 'error'); }
    finally { setBatchSaving(false); }
  };

  const handleItemImageUpdate = async (item) => {
    try {
      const result = await pickFromGallery();
      const url = await uploadToSupabaseStorage(result.dataUrl);
      await updateItem(item.id, { imageUrl: url });
      showToast('Gambar berhasil diperbarui', 'success');
      loadData();
    } catch (err) {
      if (err.message !== 'Tidak ada gambar dipilih') {
        showToast(err.message, 'warning');
      }
    }
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');

  if (!adminReady) {
    return (
      <div className="min-h-screen flex flex-col bg-dark-surface">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }
  if (!admin) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-dark-surface">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark-surface">
      <Navbar />

      <div className="flex-1 px-5 pt-6 pb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Admin Panel</h1>
            <p className="text-sm text-[#94A3B8] mt-1">Paduka</p>
          </div>
        </div>

        <div className="flex bg-dark-card rounded-2xl p-1 border border-dark-border mb-5">
          {ADMIN_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-primary-500/10 text-primary-400 shadow-sm'
                  : 'text-[#64748B]'
              }`}
            >
              {tab.label}
              {tab.key === 'bookings' && pendingBookings.length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {pendingBookings.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'bookings' && (
          <div className="space-y-2.5 animate-fade-in-up">
            {bookings.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-3xl block mb-3 opacity-30">📋</span>
                <p className="text-sm text-[#64748B]">Belum ada pengajuan</p>
              </div>
            ) : (
              bookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} showAdmin onApprove={handleApprove} onReject={handleReject} onReturn={handleReturn} actionBookingId={actionBookingId} />
              ))
            )}
          </div>
        )}

        {activeTab === 'items' && (
          <div className="space-y-3 animate-fade-in-up">
            <div className="flex gap-2">
              <button
                onClick={() => { setFormName(''); setFormQty(''); setFormImage(null); setAddModal(true); }}
                className="flex-1 py-3.5 rounded-2xl border-2 border-dashed border-dark-border-light text-sm text-[#64748B] font-medium active:scale-[0.97] transition-all duration-200 hover:border-primary-500/40 hover:text-primary-400"
              >
                + Tambah Barang
              </button>
              <button
                onClick={batchMode ? cancelBatchMode : enterBatchMode}
                className={`px-4 py-3.5 rounded-2xl text-sm font-medium active:scale-[0.97] transition-all duration-200 ${
                  batchMode
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                }`}
              >
                {batchMode ? 'Batal' : 'Edit Massal'}
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-16"><p className="text-sm text-[#64748B]">Belum ada barang</p></div>
            ) : batchMode ? (
              <>
                <div className="space-y-2.5">
                  {items.map(item => {
                    const draft = draftItems[item.id] || { name: item.name, totalQty: item.totalQty };
                    return (
                      <div key={item.id} className="card-dark">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-dark-card-hover overflow-hidden shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-dark-border-light text-lg">📷</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-[#E2E8F0] text-sm truncate">{item.name}</h3>
                            <p className="text-xs text-[#64748B] mt-0.5">Tersedia: {item.availableQty}</p>
                          </div>
                        </div>
                        <div className="flex gap-2.5">
                          <div className="flex-1">
                            <label className="text-[10px] font-semibold text-[#64748B] mb-1 block">Nama</label>
                            <input
                              type="text"
                              value={draft.name}
                              onChange={e => updateDraft(item.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-dark-card-hover border border-dark-border text-sm text-[#E2E8F0] outline-none focus:border-primary-500 transition-colors"
                            />
                          </div>
                          <div className="w-20">
                            <label className="text-[10px] font-semibold text-[#64748B] mb-1 block">Total</label>
                            <input
                              type="number"
                              min={1}
                              value={draft.totalQty}
                              onChange={e => updateDraft(item.id, 'totalQty', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-dark-card-hover border border-dark-border text-sm text-[#E2E8F0] outline-none focus:border-primary-500 transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={handleBatchSave}
                  disabled={batchSaving}
                  className="btn-primary w-full text-sm sticky bottom-0"
                >
                  {batchSaving ? 'Menyimpan...' : `Simpan Semua Perubahan`}
                </button>
              </>
            ) : (
              items.map(item => (
                <div key={item.id} className="card-dark flex items-center gap-3">
                  <button
                    onClick={() => handleItemImageUpdate(item)}
                    className="w-12 h-12 rounded-xl bg-dark-card-hover overflow-hidden shrink-0 active:scale-90 transition-all border border-dark-border"
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-dark-border-light/40">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                        </svg>
                      </div>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[#E2E8F0] text-sm truncate">{item.name}</h3>
                    <p className="text-xs text-[#64748B] mt-0.5">Total: {item.totalQty} · Tersedia: {item.availableQty}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => openEditModal(item)} className="text-xs font-medium px-3 py-1.5 rounded-xl bg-primary-500/10 text-primary-400 active:scale-90 transition-all">Edit</button>
                    <button onClick={() => setConfirmDeleteItem(item.id)} className="text-xs font-medium px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 active:scale-90 transition-all">Hapus</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="card-dark">
              <h3 className="font-semibold text-sm text-[#E2E8F0] mb-3">Teks Selamat Datang</h3>
              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-[#94A3B8] mb-1.5 block">Judul (Heading)</label>
                  <input
                    type="text"
                    value={config.welcomeHeading}
                    onChange={e => setConfig(p => ({ ...p, welcomeHeading: e.target.value }))}
                    className="input-field"
                    placeholder="Halo!"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#94A3B8] mb-1.5 block">Subtitle / Deskripsi</label>
                  <textarea
                    value={config.welcomeSubtitle}
                    onChange={e => setConfig(p => ({ ...p, welcomeSubtitle: e.target.value }))}
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Mau ambil atau cek barang inventaris? ..."
                  />
                </div>
              </div>
            </div>

            <div className="card-dark">
              <h3 className="font-semibold text-sm text-[#E2E8F0] mb-1">Penyimpanan Gambar</h3>
              <p className="text-xs text-[#64748B] mb-3">Gambar otomatis disimpan di Supabase Storage (bucket: <span className="text-primary-400">item-images</span>). Semua device bisa akses gambar yang sama.</p>
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={configSaving}
              className="btn-primary w-full text-sm"
            >
              {configSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Menyimpan...
                </span>
              ) : 'Simpan Pengaturan'}
            </button>
          </div>
        )}
      </div>

      <Link href="/dashboard" className="block text-center text-sm text-[#64748B] pb-6 hover:text-[#E2E8F0] transition-colors">← Kembali ke Beranda</Link>

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Tambah Barang">
        <div className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-[#94A3B8] mb-2 block">Foto Barang</label>
            {formImage ? (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-dark-card-hover mb-2">
                <img src={formImage} alt="Preview" className="w-full h-full object-cover" />
                <button onClick={() => setFormImage(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-xs">✕</button>
              </div>
            ) : null}
            <div className="flex gap-2">
              <button onClick={() => handleImagePick(true)} className="flex-1 py-2.5 rounded-xl bg-dark-card border border-dark-border text-xs font-medium text-[#94A3B8] active:scale-[0.97] transition-all flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
                Kamera
              </button>
              <button onClick={() => handleImagePick(false)} className="flex-1 py-2.5 rounded-xl bg-dark-card border border-dark-border text-xs font-medium text-[#94A3B8] active:scale-[0.97] transition-all flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                Galeri
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#94A3B8] mb-2 block">Nama Barang</label>
            <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="input-field" placeholder="Contoh: Kipas Angin" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#94A3B8] mb-2 block">Total Qty Awal</label>
            <input type="number" min={1} value={formQty} onChange={e => setFormQty(e.target.value)} className="input-field" placeholder="1" />
          </div>
          <button onClick={handleAddItem} disabled={formSubmitting} className="btn-primary w-full text-sm mt-1">
            {formSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Menyimpan...
              </span>
            ) : 'Simpan'}
          </button>
        </div>
      </Modal>

      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Barang">
        <div className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-[#94A3B8] mb-2 block">Foto Barang</label>
            {formImage ? (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-dark-card-hover mb-2">
                <img src={formImage} alt="Preview" className="w-full h-full object-cover" />
                <button onClick={() => setFormImage(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-xs">✕</button>
              </div>
            ) : editItem?.imageUrl ? (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-dark-card-hover mb-2">
                <img src={editItem.imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : null}
            <div className="flex gap-2">
              <button onClick={() => handleImagePick(true)} className="flex-1 py-2.5 rounded-xl bg-dark-card border border-dark-border text-xs font-medium text-[#94A3B8] active:scale-[0.97] transition-all flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
                Kamera
              </button>
              <button onClick={() => handleImagePick(false)} className="flex-1 py-2.5 rounded-xl bg-dark-card border border-dark-border text-xs font-medium text-[#94A3B8] active:scale-[0.97] transition-all flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                Galeri
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#94A3B8] mb-2 block">Nama Barang</label>
            <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#94A3B8] mb-2 block">Total Qty</label>
            <input type="number" min={1} value={formQty} onChange={e => setFormQty(e.target.value)} className="input-field" />
            {editItem && <p className="text-xs text-[#64748B] mt-1.5">Tersedia saat ini: {editItem.availableQty}. Selisih qty akan menyesuaikan stok tersedia.</p>}
          </div>
          <button onClick={handleEditItem} disabled={formSubmitting} className="btn-primary w-full text-sm mt-1">
            {formSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Menyimpan...
              </span>
            ) : 'Simpan Perubahan'}
          </button>
        </div>
      </Modal>

      {/* ── Confirm Return ── */}
      <Modal open={!!confirmReturnBooking} onClose={() => setConfirmReturnBooking(null)} title="Kembalikan Barang?">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
          </div>
          <p className="text-sm text-[#E2E8F0] font-medium leading-relaxed">
            Barang yang sudah dikembalikan nanti tidak bisa dibatalkan lagi.
          </p>
          <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
            Stok barang akan dikembalikan dan booking akan ditandai sebagai dikembalikan.
          </p>
          <div className="flex gap-2.5 mt-6">
            <button
              onClick={() => setConfirmReturnBooking(null)}
              className="flex-1 py-3 rounded-xl bg-dark-card-hover border border-dark-border text-xs font-semibold text-[#94A3B8] active:scale-95 transition-all"
            >
              Batal
            </button>
            <button
              onClick={confirmReturn}
              className="flex-1 py-3 rounded-xl bg-amber-500 text-white text-xs font-semibold active:scale-95 transition-all"
            >
              Ya, Kembalikan
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Confirm Delete ── */}
      <Modal open={!!confirmDeleteItem} onClose={() => setConfirmDeleteItem(null)} title="Hapus Barang?">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-sm text-[#E2E8F0] font-medium leading-relaxed">
            Barang yang dihapus tidak bisa dikembalikan lagi.
          </p>
          <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
            Semua data terkait barang ini akan dihapus permanen.
          </p>
          <div className="flex gap-2.5 mt-6">
            <button
              onClick={() => setConfirmDeleteItem(null)}
              className="flex-1 py-3 rounded-xl bg-dark-card-hover border border-dark-border text-xs font-semibold text-[#94A3B8] active:scale-95 transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteItem}
              disabled={itemActionLoading}
              className="flex-1 py-3 rounded-xl bg-red-500 text-white text-xs font-semibold active:scale-95 transition-all disabled:opacity-60"
            >
              {itemActionLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Menghapus...
                </span>
              ) : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </Modal>

      <Toast open={toast.open} message={toast.message} type={toast.type} onClose={() => setToast({ open: false, message: '', type: 'info' })} />
    </div>
  );
}
