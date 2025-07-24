import type { Metadata } from 'next';
import './globals.css';
import Fathom from './fathom';

export const metadata: Metadata = {
  title: 'Capa - Contact Sheet Generator',
  description: 'Generate contact sheets from your images',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Fathom />
        {children}
      </body>
    </html>
  );
}
