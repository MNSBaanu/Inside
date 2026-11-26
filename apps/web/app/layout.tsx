import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Inter_Tight } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { FooterGate } from '@/components/layout/footer-gate';
import { SessionProvider } from '@/components/providers/session-provider';
import { TopProgress } from '@/components/layout/top-progress';
import { ToastProvider } from '@/components/ui/toast';

const brand = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-brand',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  ),
  title: 'Inside - Interior design, matched to your space',
  description:
    'A marketplace connecting homeowners with interior designers, from first brief to final handover.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={brand.variable}>
      <body>
        <ClerkProvider signInUrl="/login" signUpUrl="/register">
          <SessionProvider>
            <ToastProvider>
              <TopProgress />
              <a href="#main" className="skip-link">
                Skip to content
              </a>
              <SiteHeader />
              <main id="main">{children}</main>
              <FooterGate>
                <SiteFooter />
              </FooterGate>
            </ToastProvider>
          </SessionProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
