import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

/**
 * INSTRUKSI KONFIGURASI FIREBASE
 * ================================
 *
 * Langkah-langkah:
 * 1. Buka Firebase Console: https://console.firebase.google.com/
 * 2. Buat project baru atau gunakan yang sudah ada
 * 3. Pergi ke Project Settings
 * 4. Salin konfigurasi Firebase (SDK setup and configuration)
 * 5. Pilih salah satu cara konfigurasi di bawah:
 *
 * CARA 1: LANGSUNG DI VARIABLE (Development/Testing)
 * =====================================================
 * Ganti nilai-nilai placeholder di bawah dengan konfigurasi Anda
 *
 * CARA 2: MENGGUNAKAN .env.local (Recommended untuk Production)
 * =============================================================
 * 1. Copy file .env.example ke .env.local
 * 2. Isi nilai-nilai Firebase di .env.local
 * 3. Uncomment bagian "Load from environment variables" di bawah
 * 4. Comment bagian "Direct configuration" di bawah
 */

// ============================================
// CARA 1: DIRECT CONFIGURATION (Testing)
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyDH0IGsB33IbO4qf1CgXqXM9s6qCoF1iU4",
  authDomain: "login-trial-404.firebaseapp.com",
  projectId: "login-trial-404",
  storageBucket: "login-trial-404.firebasestorage.app",
  messagingSenderId: "5372108123",
  appId: "1:5372108123:web:5a0c53ea70a36ece360e7e",
  measurementId: "G-29P4R5BHJJ",
};

// ============================================
// CARA 2: LOAD FROM ENVIRONMENT VARIABLES
// ============================================
// Uncomment kode di bawah untuk menggunakan environment variables
// Dan comment bagian CARA 1 di atas

/*
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
*/

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;
