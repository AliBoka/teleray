import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TG V2Ray Exporter',
  description: 'Telegram Channel V2Ray Config Extractor and Subscription Server',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className="h-full dark">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
