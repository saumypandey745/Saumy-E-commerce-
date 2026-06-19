"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '../store';
import { Store, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, user } = useAppStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Enforce that the user role must be SELLER or ADMIN.
    if (isLoggedIn && user?.role !== 'SELLER' && user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [isLoggedIn, user, router]);

  if (!mounted) return null;

  if (!isLoggedIn || (user?.role !== 'SELLER' && user?.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] pt-32 pb-20 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-dark-800 rounded-3xl shadow-xl border border-red-200 dark:border-red-900/30 p-8 text-center"
        >
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Seller Access Only</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            You must be a registered seller to access the Vendor Portal.
          </p>
          <button 
            onClick={() => router.push('/')}
            className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold transition-colors hover:bg-brand-700"
          >
            Return to Storefront
          </button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
