import type { Metadata } from 'next';
import './globals.css';

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
