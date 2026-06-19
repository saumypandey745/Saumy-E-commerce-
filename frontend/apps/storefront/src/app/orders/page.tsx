"use client";

import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Package, Clock, CheckCircle2, XCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrdersPage() {
  const { isLoggedIn, language } = useAppStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/orders');
      if (res.data.success) {
        setOrders(res.data.orders || []);
      }
    } catch (e) {
      console.error('Failed to fetch orders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders();
      // Polling for real-time tracking
      const interval = setInterval(fetchOrders, 10000); // 10s
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center pt-24 pb-20 text-center px-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">You are not logged in</h2>
          <p className="text-slate-500 mb-8">Please sign in to view your orders.</p>
          <Link href="/auth/login" className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">Order History</h1>
          <button onClick={fetchOrders} className="flex items-center gap-2 text-sm font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {loading && orders.length === 0 ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-slate-200 dark:bg-dark-700 h-40 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-dark-800 rounded-3xl p-16 text-center border border-slate-200 dark:border-dark-700">
            <div className="w-20 h-20 bg-slate-100 dark:bg-dark-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No orders yet</h2>
            <p className="text-slate-500 mb-6">You haven't placed any orders. Start exploring our catalog.</p>
            <Link href="/products" className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold">
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <motion.div 
                key={order.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-slate-200 dark:border-dark-700 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-6 border-b border-slate-100 dark:border-dark-700 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Order #{order.id.substring(0, 8).toUpperCase()}</p>
                    <p className="font-bold text-slate-900 dark:text-white">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.status === 'PENDING' || order.status === 'PROCESSING' ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-xs font-bold uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5" /> {order.status}
                      </span>
                    ) : order.status === 'CONFIRMED' || order.status === 'DELIVERED' ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {order.status}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-bold uppercase tracking-wider">
                        <XCircle className="w-3.5 h-3.5" /> {order.status}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total</p>
                    <p className="font-black text-xl text-slate-900 dark:text-white">${parseFloat(order.total_amount).toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-dark-900 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 dark:text-white">Product ID: {item.product_id}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Qty: {item.quantity} | ${parseFloat(item.price).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
