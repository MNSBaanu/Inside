import type { Metadata } from 'next';
import { DM_Sans, Fraunces } from 'next/font/google';
import './globals.css';

const sans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
});

const heading = Fraunces({
  variable: '--font-heading',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Inside',
  description:
    'Interior design marketplace — portfolios, briefs, staged collaboration, and milestone payments.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${heading.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
