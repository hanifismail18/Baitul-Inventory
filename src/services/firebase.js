import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ─── CARA ISI FIREBASE ────────────────────────────────────────────────────────
// Opsi A — Lewat .env.local (lebih aman, recommended):
//   1. Buka file .env.local di root proyek
//   2. Isi nilai sesuai project Firebase kamu
//   3. Restart `npm run dev`
//
// Opsi B — Edit langsung di bawah ini (lebih cepat):
//   1. Ganti 'ISI_API_KEY_KAMU' dkk dengan nilai dari Firebase Console
//   2. Simpan file, jalanin `npm run dev`
// ──────────────────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyDH0IGsB33IbO4qf1CgXqXM9s6qCoF1iU4",
  authDomain: "login-trial-404.firebaseapp.com",
  projectId: "login-trial-404",
  storageBucket: "login-trial-404.firebasestorage.app",
  messagingSenderId: "5372108123",
  appId: "1:5372108123:web:5a0c53ea70a36ece360e7e",
  measurementId: "G-29P4R5BHJJ",
};

const isConfigured = () => {
  return (
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes("ISI_") &&
    firebaseConfig.projectId &&
    !firebaseConfig.projectId.includes("ISI_")
  );
};

let app = null;
let auth = null;
let googleProvider = null;
let db = null;

if (isConfigured()) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  db = getFirestore(app);
  console.log("🔥 Firebase berhasil dikonfigurasi");
} else {
  console.log("ℹ️ Firebase belum dikonfigurasi — menggunakan mode demo");
}

export { app, auth, googleProvider, db, isConfigured };
export default firebaseConfig;
