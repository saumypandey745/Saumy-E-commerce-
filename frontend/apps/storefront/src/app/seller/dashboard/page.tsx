// @ts-nocheck
"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/SellerDashboardLayout';
import { api } from '@/lib/api';
import { useAppStore } from '@/app/store';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  AlertCircle,
  ArrowUpRight,
  Store
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    total_revenue: 0,
    total_orders: 0,
    active_products: 0,
    top_products: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [analyticsRes, productsRes] = await Promise.all([
          api.get('/api/orders/analytics/seller'),
          api.get(`/api/products?seller_id=${user?.id}`)
        ]);

        if (analyticsRes.data.success) {
          setAnalytics({
            ...analyticsRes.data.data,
            active_products: productsRes.data?.products?.length || 0
          });
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchDashboardData();
    }
  }, [user]);

  const stats = [
    { name: 'Total Revenue', value: `$${analytics.total_revenue.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Total Orders', value: analytics.total_orders, icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Active Products', value: analytics.active_products, icon: Package, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { name: 'Conversion Rate', value: '3.2%', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Welcome back, here's what's happening with your store today.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.name}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-emerald-500 flex items-center font-medium">
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    12%
                  </span>
                  <span className="text-slate-500 ml-2">vs last month</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Products */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Top Selling Products</h2>
              {analytics.top_products.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-6 py-3 rounded-l-lg">Product SKU</th>
                        <th className="px-6 py-3">Units Sold</th>
                        <th className="px-6 py-3 rounded-r-lg">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.top_products.map((item: any, i) => (
                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                            {item.sku}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                            {item.total_quantity}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                            ${parseFloat(item.total_revenue).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                  <Package className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                  <p>No products sold yet.</p>
                </div>
              )}
            </div>

            {/* Alerts & Notifications */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Alerts</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Low Stock Warning</p>
                    <p className="text-xs text-amber-600 dark:text-amber-500/80 mt-1">2 products are running low on inventory.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                  <Store className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-indigo-800 dark:text-indigo-400">Welcome to Seller Hub</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-500/80 mt-1">Complete your store profile to start selling globally.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
