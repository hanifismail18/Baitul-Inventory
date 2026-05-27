-- =====================================================
-- MIGRASI BAITUL STOCK OPNAME KE SUPABASE
-- Jalankan SQL ini di Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. TABEL ITEMS
CREATE TABLE IF NOT EXISTS items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  total_qty INTEGER NOT NULL,
  available_qty INTEGER NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABEL BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  qty INTEGER NOT NULL,
  user_email TEXT NOT NULL DEFAULT '',
  user_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','picked_up','returned','expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  notified_day1 BOOLEAN DEFAULT false,
  notified_day2 BOOLEAN DEFAULT false,
  notified_day3 BOOLEAN DEFAULT false
);

-- 3. TABEL CONFIG (single row)
CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  welcome_heading TEXT DEFAULT 'Halo!',
  welcome_subtitle TEXT DEFAULT 'Mau ambil atau cek barang inventaris? Silakan cek ketersediaan barang atau lihat status booking kamu di bawah ini, ya.',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default config row
INSERT INTO config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 4. ROW LEVEL SECURITY (buka akses untuk sementara)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all items" ON items;
CREATE POLICY "Allow all items" ON items FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all bookings" ON bookings;
CREATE POLICY "Allow all bookings" ON bookings FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all config" ON config;
CREATE POLICY "Allow all config" ON config FOR ALL USING (true);

-- =====================================================
-- SETELAH INI, LAKUKAN DI SUPABASE DASHBOARD:
-- =====================================================
-- A. Authentication > Settings > Redirect URLs:
--    Tambahkan: http://localhost:3000/**
--    Tambahkan: https://*.vercel.app/**
--    (sesuaikan dengan URL Vercel kamu)
--
-- B. Authentication > Providers > Google:
--    1. Aktifkan (Enable)
--    2. Isi Client ID & Client Secret dari Google Cloud Console
--    3. Callback URL ada di halaman tsb (copy paste ke Google Cloud Console)
--
-- C. Storage > Buckets:
--    1. Buat bucket baru: "item-images"
--    2. Public bucket (centang Public)
--    3. Di tab Policies, tambah policy: "Allow all" ON item-images FOR ALL USING (true)
--
-- D. Database > Replication > Enable Realtime:
--    Pastikan tabel items, bookings, config sudah terdaftar di publikasi supabase_realtime
ALTER PUBLICATION supabase_realtime ADD TABLE items;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE config;
