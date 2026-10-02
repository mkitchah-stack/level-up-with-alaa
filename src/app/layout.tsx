import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'LEVEL UP WITH ALAA — BAC 2027', template: '%s · LEVEL UP WITH ALAA' },
  description: 'خطة 132 يومًا لإتمام مقرر المواد الثانوية — BAC 2027',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#1F4A3E',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
