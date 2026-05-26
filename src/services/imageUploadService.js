import { storage, isConfigured } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const compressImage = (file, maxWidth = 600, quality = 0.6) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((maxWidth / width) * height);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const pickImage = (capture = false) => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (capture) input.capture = 'environment';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) { reject(new Error('Tidak ada gambar dipilih')); return; }
      try {
        const compressed = await compressImage(file);
        resolve(compressed);
      } catch (err) {
        reject(new Error('Gagal mengompres gambar'));
      }
    };
    input.click();
  });
};

export const captureFromCamera = () => pickImage(true);
export const pickFromGallery = () => pickImage(false);

const dataUrlToBlob = (dataUrl) => {
  const byteString = atob(dataUrl.split(',')[1]);
  const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  return new Blob([ab], { type: mimeString });
};

export const uploadImageToStorage = async (dataUrl, path = 'items') => {
  if (!isConfigured()) return dataUrl;
  try {
    const blob = dataUrlToBlob(dataUrl);
    const filename = `${path}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
    const storageRef = ref(storage, filename);
    const snapshot = await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (e) {
    console.warn('Firebase Storage upload failed, using base64 fallback:', e.message);
    return dataUrl;
  }
};
