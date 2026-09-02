import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://astera-estate-ops.onyonn.chatgpt.site'),
  title: 'ASTERA — Private Estate Operations',
  description:
    'A calm command center for private estates, trusted vendors, accountable approvals, and incident response.',
  openGraph: {
    title: 'ASTERA — Private Estate Operations',
    description:
      'A calm command center for private estates, trusted vendors, accountable approvals, and incident response.',
    type: 'website',
    url: 'https://astera-estate-ops.onyonn.chatgpt.site',
    siteName: 'ASTERA',
    images: [
      {
        url: 'https://astera-estate-ops.onyonn.chatgpt.site/og-light.png',
        width: 1672,
        height: 941,
        alt: 'ASTERA private estate operations command center',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ASTERA — Private Estate Operations',
    description:
      'A calm command center for private estates, trusted vendors, accountable approvals, and incident response.',
    images: ['https://astera-estate-ops.onyonn.chatgpt.site/og-light.png'],
  },
  alternates: {
    canonical: 'https://astera-estate-ops.onyonn.chatgpt.site',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
