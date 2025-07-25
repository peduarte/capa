import type { Metadata } from 'next';
import { Permanent_Marker, Rock_Salt } from 'next/font/google';
import './globals.css';
import Fathom from './fathom';

const permanentMarker = Permanent_Marker({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-permanent-marker',
});

const rockSalt = Rock_Salt({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-rock-salt',
});

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
      <body
        className={`antialiased ${permanentMarker.variable} ${rockSalt.variable}`}
      >
        <Fathom />
        {children}
      </body>
    </html>
  );
}
