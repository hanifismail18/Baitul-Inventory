import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { CartProvider } from '@/contexts/CartContext';
import MobileContainer from '@/components/MobileContainer';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'Baitul Garbera',
  description: 'Request & Booking Stock Opname',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={inter.className}>
      <body className="bg-dark-bg">
        <AuthProvider>
          <AdminProvider>
            <CartProvider>
              <MobileContainer>{children}</MobileContainer>
            </CartProvider>
          </AdminProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
