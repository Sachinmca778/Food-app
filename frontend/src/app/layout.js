import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'DirectDine — 0% Commission Direct Restaurant Ordering & KDS OS',
  description: 'Stop paying 30% aggregator commissions. DirectDine gives restaurants and cloud kitchens their own branded online storefront, automated WhatsApp bot, table QR, and instant UPI bank settlements.',
  keywords: ['restaurant ordering software', '0 commission food ordering', 'restaurant whatsapp bot', 'kitchen display system', 'table qr ordering india', 'direct food delivery saas'],
  authors: [{ name: 'DirectDine Technologies' }],
  openGraph: {
    title: 'DirectDine — 0% Commission Direct Restaurant Ordering & KDS OS',
    description: 'Stop paying 30% aggregator commissions. Own your customers, branded storefront, WhatsApp ordering bot, and instant UPI settlements.',
    url: 'https://directdine.in',
    siteName: 'DirectDine',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DirectDine — 0% Commission Direct Restaurant Ordering',
    description: 'Keep 100% of your food revenue. Branded storefront, WhatsApp bot, table QR & instant UPI settlements.',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍽️</text></svg>" />
      </head>
      <body>
        <Providers>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
