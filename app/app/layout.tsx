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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

export default RootLayout;
