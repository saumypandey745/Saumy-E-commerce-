// src/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingChatWidget from '@/components/FloatingChatWidget';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'E‑Comm Enterprise',
  description: 'Premium ecommerce storefront with modern UI and full‑stack features.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100 min-h-screen flex flex-col transition-colors duration-300`}> 
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />
          <main className="flex-grow flex flex-col pt-16">
            {children}
          </main>
          <Footer />
          <FloatingChatWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
