'use client';

import { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'baitul_cart';

const saveCart = (items) => {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'SET_ITEMS':
      return action.payload;
    case 'ADD_ITEM': {
      const existing = state.find(i => i.itemId === action.payload.itemId);
      if (existing) {
        return state.map(i =>
          i.itemId === action.payload.itemId
            ? { ...i, qty: Math.min(i.qty + action.payload.qty, i.maxQty) }
            : i
        );
      }
      return [...state, { itemId: action.payload.itemId, name: action.payload.name, qty: Math.min(action.payload.qty, action.payload.maxQty), maxQty: action.payload.maxQty }];
    }
    case 'UPDATE_QTY':
      return state.map(i =>
        i.itemId === action.payload.itemId
          ? { ...i, qty: Math.max(1, Math.min(action.payload.qty, i.maxQty)) }
          : i
      );
    case 'REMOVE_ITEM':
      return state.filter(i => i.itemId !== action.payload.itemId);
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, []);
  const [cartReady, setCartReady] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const saved = JSON.parse(data);
        if (saved.length > 0) {
          dispatch({ type: 'SET_ITEMS', payload: saved });
        }
      }
    } catch {}
    hydrated.current = true;
    setCartReady(true);
  }, []);

  useEffect(() => {
    if (hydrated.current) {
      saveCart(items);
    }
  }, [items]);

  const addItem = (itemId, name, qty, maxQty) =>
    dispatch({ type: 'ADD_ITEM', payload: { itemId, name, qty, maxQty } });

  const updateQty = (itemId, qty) =>
    dispatch({ type: 'UPDATE_QTY', payload: { itemId, qty } });

  const removeItem = (itemId) =>
    dispatch({ type: 'REMOVE_ITEM', payload: { itemId } });

  const clearCart = () => dispatch({ type: 'CLEAR' });

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const itemCount = items.length;

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clearCart, totalItems, itemCount, cartReady }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
