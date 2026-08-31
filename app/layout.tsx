import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ASTERA — Private Estate Operations',
  description:
    'A calm command center for private estates, trusted vendors, accountable approvals, and incident response.',
  openGraph: {
    title: 'ASTERA — Private Estate Operations',
    description:
      'A calm command center for private estates, trusted vendors, accountable approvals, and incident response.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ASTERA — Private Estate Operations',
    description:
      'A calm command center for private estates, trusted vendors, accountable approvals, and incident response.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
