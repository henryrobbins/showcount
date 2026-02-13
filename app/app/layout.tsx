import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';

import Footer from '@/components/Footer';
import Header from '@/components/Header';

import './globals.css';

export const metadata: Metadata = {
  title: 'SHOWCOUNT',
  description: 'Concert tracking. Coming soon.',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body suppressHydrationWarning>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}

export default RootLayout;
