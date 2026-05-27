import { supabase, STORAGE_BUCKET } from '@/config/supabase'

const withTimeout = (promise, ms = 8000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Supabase timeout after ${ms}ms`)), ms)),
  ])

// ─── TRANSFORM (snake_case → camelCase) ────────────────────────

const toCamel = (row) => {
  if (!row) return row
  const obj = {}
  for (const key of Object.keys(row)) {
    obj[key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = row[key]
  }
  return obj
}

const toSnake = (obj) => {
  if (!obj) return obj
  const result = {}
  for (const key of Object.keys(obj)) {
    result[key.replace(/[A-Z]/g, c => '_' + c.toLowerCase())] = obj[key]
  }
  return result
}

// ─── ITEMS ──────────────────────────────────────────────────────

export const getItems = async () => {
  try {
    const { data, error } = await withTimeout(
      supabase.from('items').select('*').order('name')
    )
    if (error) throw error
    return (data || []).map(toCamel)
  } catch (e) {
    console.warn('supabase: getItems failed', e.message)
    throw e
  }
}

export const addItem = async (name, totalQty, imageUrl = null) => {
  const itemData = { name, totalQty, availableQty: Number(totalQty), imageUrl }
  try {
    const { data, error } = await withTimeout(
      supabase.from('items').insert(toSnake(itemData)).select()
    )
    if (error) throw error
    return toCamel(data?.[0]) || itemData
  } catch (e) {
    console.warn('supabase: addItem failed', e.message)
    throw e
  }
}

export const updateItem = async (id, updates) => {
  try {
    const { data, error } = await withTimeout(
      supabase.from('items').update(toSnake(updates)).eq('id', id).select()
    )
    if (error) throw error
    return toCamel(data?.[0]) || { id, ...updates }
  } catch (e) {
    console.warn('supabase: updateItem failed', e.message)
    throw e
  }
}

export const deleteItem = async (id) => {
  try {
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) throw error
  } catch (e) {
    console.warn('supabase: deleteItem failed', e.message)
    throw e
  }
}

export const seedItems = async (items) => {
  try {
    const { count, error: countError } = await supabase.from('items').select('*', { count: 'exact', head: true })
    if (countError) throw countError
    if (count > 0) return { seeded: false, count }
    const dbItems = items.map(item => toSnake({
      name: item.name,
      totalQty: Number(item.totalQty),
      availableQty: Number(item.availableQty),
      imageUrl: item.imageUrl || null,
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
      supabase.from('bookings').select('*').order('created_at', { ascending: false })
    )
    if (error) throw error
    return (data || []).map(toCamel)
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
      supabase.from('bookings').insert(toSnake(data)).select()
    )
    if (error) throw error
    return toCamel(result?.[0]) || data
  } catch (e) {
    console.warn('supabase: addBooking failed', e.message)
    throw e
  }
}

export const updateBooking = async (id, updates) => {
  try {
    const { data, error } = await withTimeout(
      supabase.from('bookings').update(toSnake(updates)).eq('id', id).select()
    )
    if (error) throw error
    return toCamel(data?.[0])
  } catch (e) {
    console.warn('supabase: updateBooking failed', e.message)
    throw e
  }
}

export const getItemById = async (id) => {
  try {
    const { data, error } = await withTimeout(
      supabase.from('items').select('*').eq('id', id).single()
    )
    if (error) throw error
    return toCamel(data)
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
  try {
    const { error } = await supabase.from('config').update({
      ...toSnake(updates),
      updated_at: new Date().toISOString(),
    }).eq('id', 1)
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
