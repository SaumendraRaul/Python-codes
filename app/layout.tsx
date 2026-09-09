import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Slate',
  description: 'A quiet place for temporary notes.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
