import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import StoreProvider from '@/components/providers/StoreProvider';
import AppInitializer from '@/components/providers/AuthInitializer';
import { SearchProvider } from '@/contexts/SearchContext';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Pharmify - Nhà thuốc online',
  description:
    'Nhà thuốc trực tuyến Pharmify - Mua thuốc, thực phẩm chức năng, thiết bị y tế chính hãng với giá tốt nhất',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={inter.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <StoreProvider>
          <AppInitializer>
            <SearchProvider>{children}</SearchProvider>
          </AppInitializer>
        </StoreProvider>
      </body>
    </html>
  );
}
