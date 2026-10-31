import type { Metadata, Viewport } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://teleray.vercel.app');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  title: {
    default: 'TeleRay | استخراج خودکار کانفیگ و ساخت سابسکرایبشن تلگرام',
    template: '%s | TeleRay',
  },
  description:
    'استخراج خودکار کانفیگ‌های V2Ray از کانال‌های تلگرام و ساخت لینک سابسکرایبشن سازگار با تمام کلاینت‌ها بدون نیاز به توکن.',
  applicationName: 'TeleRay',
  authors: [{ name: 'AliBoka', url: 'https://github.com/AliBoka' }],
  keywords: [
    'TeleRay',
    'V2Ray',
    'VLESS',
    'VMess',
    'Trojan',
    'Shadowsocks',
    'Hysteria 2',
    'TUIC',
    'Telegram scraper',
    'V2Ray subscription generator',
    'سابسکرایبشن تلگرام',
    'استخراج کانفیگ تلگرام',
  ],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: siteUrl,
    siteName: 'TeleRay',
    title: 'TeleRay | استخراج خودکار کانفیگ و ساخت سابسکرایبشن تلگرام',
    description:
      'استخراج خودکار کانفیگ‌های V2Ray از کانال‌های تلگرام و ساخت لینک سابسکرایبشن سازگار با تمام کلاینت‌ها بدون نیاز به توکن.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TeleRay - V2Ray Telegram Subscription Exporter',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@telerayy',
    creator: '@AliBoka',
    title: 'TeleRay | استخراج خودکار کانفیگ و ساخت سابسکرایبشن تلگرام',
    description:
      'استخراج خودکار کانفیگ‌های V2Ray از کانال‌های تلگرام و ساخت لینک سابسکرایبشن سازگار با تمام کلاینت‌ها.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TeleRay - V2Ray Telegram Subscription Exporter',
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'TeleRay',
  url: siteUrl,
  description:
    'استخراج خودکار کانفیگ‌های V2Ray از کانال‌های تلگرام و ساخت لینک سابسکرایبشن سازگار با انواع کلاینت‌ها بدون نیاز به توکن.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  author: {
    '@type': 'Person',
    name: 'AliBoka',
    url: 'https://github.com/AliBoka',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storedTheme = localStorage.getItem('theme');
                if (storedTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 antialiased">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
