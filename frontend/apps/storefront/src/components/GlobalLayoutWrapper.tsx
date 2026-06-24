"use client";

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function GlobalLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Paths that should not have the global header and footer
  const isDashboardLayout = 
    pathname?.startsWith('/seller/dashboard') ||
    pathname?.startsWith('/seller/products') ||
    pathname?.startsWith('/seller/orders') ||
    pathname?.startsWith('/seller/settings') ||
    pathname?.startsWith('/admin');

  if (isDashboardLayout) {
    return (
      <main className="flex-grow flex flex-col">
        {children}
      </main>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-grow flex flex-col pt-16">
        {children}
      </main>
      <Footer />
    </>
  );
}
