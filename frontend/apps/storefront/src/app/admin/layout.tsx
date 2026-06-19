"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '../store';
import { ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, user } = useAppStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Developer bypass for admin role is handled by token in api-gateway, 
    // but on frontend we enforce that the user role must be ADMIN.
    if (isLoggedIn && user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [isLoggedIn, user, router]);

  if (!mounted) return null;

  if (!isLoggedIn || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] pt-32 pb-20 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-dark-800 rounded-3xl shadow-xl border border-red-200 dark:border-red-900/30 p-8 text-center"
        >
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            You do not have the required administrative privileges to view this page.
          </p>
          <button 
            onClick={() => router.push('/')}
            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold transition-colors hover:bg-slate-800 dark:hover:bg-slate-100"
          >
            Return to Storefront
          </button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
