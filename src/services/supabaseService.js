import { supabase, STORAGE_BUCKET } from '@/config/supabase'

const ITEM_COLUMNS = 'id, name, total_qty as "totalQty", available_qty as "availableQty", image_url as "imageUrl", created_at as "createdAt"'
const BOOKING_COLUMNS = 'id, item_id as "itemId", item_name as "itemName", qty, user_email as "userEmail", user_name as "userName", status, created_at as "createdAt", approved_at as "approvedAt", picked_up_at as "pickedUpAt", returned_at as "returnedAt", expired_at as "expiredAt", notified_day1 as "notifiedDay1", notified_day2 as "notifiedDay2", notified_day3 as "notifiedDay3"'

const withTimeout = (promise, ms = 8000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Supabase timeout after ${ms}ms`)), ms)),
  ])

const toDbItem = (data) => ({
  name: data.name,
  total_qty: Number(data.totalQty),
  available_qty: Number(data.availableQty),
  image_url: data.imageUrl || null,
})

const toDbBooking = (data) => ({
  item_id: data.itemId,
  item_name: data.itemName || '',
  qty: Number(data.qty),
  user_email: data.userEmail || '',
  user_name: data.userName || '',
  status: data.status || 'pending',
  created_at: data.createdAt || new Date().toISOString(),
  approved_at: data.approvedAt || null,
  picked_up_at: data.pickedUpAt || null,
  returned_at: data.returnedAt || null,
  expired_at: data.expiredAt || null,
  notified_day1: data.notifiedDay1 || false,
  notified_day2: data.notifiedDay2 || false,
  notified_day3: data.notifiedDay3 || false,
})

// ─── ITEMS ──────────────────────────────────────────────────────

export const getItems = async () => {
  try {
    const { data, error } = await withTimeout(
      supabase.from('items').select(ITEM_COLUMNS).order('name')
    )
    if (error) throw error
    return data || []
  } catch (e) {
    console.warn('supabase: getItems failed', e.message)
    throw e
  }
}

export const addItem = async (name, totalQty, imageUrl = null) => {
  const itemData = { name, totalQty, availableQty: Number(totalQty), imageUrl }
  try {
    const { data, error } = await withTimeout(
      supabase.from('items').insert(toDbItem(itemData)).select(ITEM_COLUMNS)
    )
    if (error) throw error
    return data?.[0] || itemData
  } catch (e) {
    console.warn('supabase: addItem failed', e.message)
    throw e
  }
}

export const updateItem = async (id, updates) => {
  const dbUpdates = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.totalQty !== undefined) dbUpdates.total_qty = Number(updates.totalQty)
  if (updates.availableQty !== undefined) dbUpdates.available_qty = Number(updates.availableQty)
  if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl
  try {
    const { data, error } = await withTimeout(
      supabase.from('items').update(dbUpdates).eq('id', id).select(ITEM_COLUMNS)
    )
    if (error) throw error
    return data?.[0] || { id, ...updates }
  } catch (e) {
    console.warn('supabase: updateItem failed', e.message)
    throw e
  }
}

export const seedItems = async (items) => {
  try {
    const { count, error: countError } = await supabase.from('items').select('*', { count: 'exact', head: true })
    if (countError) throw countError
    if (count > 0) return { seeded: false, count }
    const dbItems = items.map((item, idx) => ({
      name: item.name,
      total_qty: Number(item.totalQty),
      available_qty: Number(item.availableQty),
      image_url: item.imageUrl || null,
    }))
    const { data, error } = await supabase.from('items').insert(dbItems).select()
    if (error) throw error
    return { seeded: true, count: data?.length || 0 }
  } catch (e) {
    console.warn('supabase: seedItems failed', e.message)
    throw e
  }
}

// ─── BOOKINGS ───────────────────────────────────────────────────

export const getBookings = async () => {
  try {
    const { data, error } = await withTimeout(
      supabase.from('bookings').select(BOOKING_COLUMNS).order('created_at', { ascending: false })
    )
    if (error) throw error
    return data || []
  } catch (e) {
    console.warn('supabase: getBookings failed', e.message)
    throw e
  }
}

export const addBooking = async (bookingData) => {
  const data = {
    itemId: bookingData.itemId,
    itemName: bookingData.itemName,
    qty: bookingData.qty,
    userEmail: bookingData.userEmail || '',
    userName: bookingData.userName || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
    approvedAt: null,
    pickedUpAt: null,
    returnedAt: null,
    expiredAt: null,
    notifiedDay1: false,
    notifiedDay2: false,
    notifiedDay3: false,
  }
  try {
    const { data: result, error } = await withTimeout(
      supabase.from('bookings').insert(toDbBooking(data)).select(BOOKING_COLUMNS)
    )
    if (error) throw error
    return result?.[0] || data
  } catch (e) {
    console.warn('supabase: addBooking failed', e.message)
    throw e
  }
}

export const updateBooking = async (id, updates) => {
  const dbUpdates = {}
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.approvedAt !== undefined) dbUpdates.approved_at = updates.approvedAt
  if (updates.pickedUpAt !== undefined) dbUpdates.picked_up_at = updates.pickedUpAt
  if (updates.returnedAt !== undefined) dbUpdates.returned_at = updates.returnedAt
  if (updates.expiredAt !== undefined) dbUpdates.expired_at = updates.expiredAt
  if (updates.notifiedDay1 !== undefined) dbUpdates.notified_day1 = updates.notifiedDay1
  if (updates.notifiedDay2 !== undefined) dbUpdates.notified_day2 = updates.notifiedDay2
  if (updates.notifiedDay3 !== undefined) dbUpdates.notified_day3 = updates.notifiedDay3
  try {
    const { data, error } = await withTimeout(
      supabase.from('bookings').update(dbUpdates).eq('id', id).select(BOOKING_COLUMNS)
    )
    if (error) throw error
    return data?.[0]
  } catch (e) {
    console.warn('supabase: updateBooking failed', e.message)
    throw e
  }
}

export const getItemById = async (id) => {
  try {
    const { data, error } = await withTimeout(
      supabase.from('items').select(ITEM_COLUMNS).eq('id', id).single()
    )
    if (error) throw error
    return data
  } catch (e) {
    console.warn('supabase: getItemById failed', e.message)
    throw e
  }
}

// ─── CONFIG ─────────────────────────────────────────────────────

export const getConfig = async () => {
  try {
    const { data, error } = await supabase.from('config').select('*').eq('id', 1).single()
    if (error) throw error
    return {
      welcomeHeading: data.welcome_heading || 'Halo!',
      welcomeSubtitle: data.welcome_subtitle || '',
    }
  } catch (e) {
    console.warn('supabase: getConfig failed', e.message)
    return { welcomeHeading: 'Halo!', welcomeSubtitle: '' }
  }
}

export const saveConfig = async (updates) => {
  const dbUpdates = {}
  if (updates.welcomeHeading !== undefined) dbUpdates.welcome_heading = updates.welcomeHeading
  if (updates.welcomeSubtitle !== undefined) dbUpdates.welcome_subtitle = updates.welcomeSubtitle
  dbUpdates.updated_at = new Date().toISOString()
  try {
    const { error } = await supabase.from('config').update(dbUpdates).eq('id', 1)
    if (error) throw error
    return true
  } catch (e) {
    console.warn('supabase: saveConfig failed', e.message)
    throw e
  }
}

// ─── STORAGE ────────────────────────────────────────────────────

export const uploadImage = async (file, fileName) => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      })
    if (error) throw error
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path)
    return urlData.publicUrl
  } catch (e) {
    console.warn('supabase: uploadImage failed', e.message)
    throw e
  }
}

export const deleteImage = async (path) => {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path])
    if (error) throw error
    return true
  } catch (e) {
    console.warn('supabase: deleteImage failed', e.message)
    throw e
  }
}
