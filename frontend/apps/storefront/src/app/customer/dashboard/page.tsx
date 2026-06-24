"use client";

import { useAppStore } from '../../store';
import { useState, useEffect } from 'react';
import { Package, Heart, CreditCard, Clock } from 'lucide-react';
import Link from 'next/link';

export default function CustomerDashboard() {
  const { user } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-brand-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl shadow-brand-500/20">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-brand-100 max-w-2xl">Manage your orders, update your profile, and discover new products recommended just for you.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-slate-200 dark:border-dark-700 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-2xl">12</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Orders</p>
          <Link href="/customer/orders" className="mt-4 text-sm font-medium text-brand-600 hover:text-brand-700">View All</Link>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-slate-200 dark:border-dark-700 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-4">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-2xl">8</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Wishlist Items</p>
          <Link href="/customer/wishlist" className="mt-4 text-sm font-medium text-brand-600 hover:text-brand-700">View All</Link>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-slate-200 dark:border-dark-700 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mb-4">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-2xl">$1,240</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Spent</p>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-slate-200 dark:border-dark-700 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-2xl">1</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Pending Order</p>
          <Link href="/customer/orders" className="mt-4 text-sm font-medium text-brand-600 hover:text-brand-700">Track Order</Link>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-slate-200 dark:border-dark-700 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-dark-700 flex justify-between items-center">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">Recent Orders</h2>
          <Link href="/customer/orders" className="text-sm font-medium text-brand-600 hover:text-brand-700">View History</Link>
        </div>
        <div className="p-6 text-center py-12 text-slate-500">
          <p>You have no recent orders.</p>
          <Link href="/products" className="mt-4 inline-block px-6 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">Start Shopping</Link>
        </div>
      </div>
    </div>
  );
}
