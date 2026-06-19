"use client";

import Link from 'next/link';
import { CheckCircle2, Package, ArrowRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CheckoutSuccessPage() {
  // Generate random order number
  const orderNumber = `ORD-${Math.floor(Math.random() * 1000000)}`;

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 dark:bg-[#0f172a] pt-24 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-xl w-full bg-white dark:bg-dark-800 rounded-3xl shadow-xl border border-slate-200 dark:border-dark-700 p-8 md:p-12 text-center"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
          className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </motion.div>

        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">Payment Successful!</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
          Thank you for your purchase. We've received your order and are getting it ready to ship.
        </p>

        <div className="bg-slate-50 dark:bg-dark-900 rounded-2xl p-6 mb-8 border border-slate-200 dark:border-dark-700 text-left flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-wider text-slate-500 uppercase mb-1">Order Number</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">{orderNumber}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/orders" 
            className="px-8 py-4 bg-slate-100 dark:bg-dark-900 text-slate-900 dark:text-white rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-dark-700 transition-colors flex items-center justify-center gap-2"
          >
            Track Order <ArrowRight className="w-4 h-4" />
          </Link>
          <Link 
            href="/products" 
            className="px-8 py-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-500/30 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Return to Shop
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
