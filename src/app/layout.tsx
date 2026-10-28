import type { Metadata } from 'next';
import { Schibsted_Grotesk, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import { StudioInit } from './studio-init';

// A guidebook's split: a sturdy grotesk for names, facts and navigation, a
// serif for the writing you actually read.
const sans = Schibsted_Grotesk({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif', display: 'swap' });

export const metadata: Metadata = {
  title: 'Wayfarer',
  description: 'Small-group trips. A Contentstack Studio hands-on site.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Studio adds a class to <html> inside its editor, before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${serif.variable}`}>
        <StudioInit />
        {children}
      </body>
    </html>
  );
}
