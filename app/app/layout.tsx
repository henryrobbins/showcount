import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';

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
        <body suppressHydrationWarning>{children}</body>
      </html>
    </ClerkProvider>
  );
}

export default RootLayout;
