"use client";

import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { translations, Language } from '../translations';
import { LayoutDashboard, Package, ShoppingCart, BarChart3, Settings, TrendingUp, Users, DollarSign, Plus, Search, Filter, ArrowLeft, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api';

const productSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  base_price: z.number().min(0.01, "Price must be greater than 0"),
  total_inventory_count: z.number().min(0, "Inventory cannot be negative"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().min(1, "Brand is required"),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function SellerDashboard() {
  const { language, user } = useAppStore();
  const t = translations[language as Language];
  const [activeTab, setActiveTab] = useState('overview');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: '',
      description: '',
      base_price: 0,
      total_inventory_count: 0,
      category: 'Electronics',
      brand: ''
    }
  });

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: data.title,
        description: data.description,
        base_price: data.base_price,
        total_inventory_count: data.total_inventory_count,
        attributes: [
          { key: 'category', value: data.category },
          { key: 'brand', value: data.brand }
        ]
      };
      const res = await api.post('/api/products', payload);
      if (res.data.success) {
        alert('Product created successfully!');
        reset();
        setActiveTab('products');
      }
    } catch (e) {
      console.error('Failed to create product', e);
      alert('Failed to create product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [statsData, setStatsData] = useState({
    total_revenue: 0,
    total_orders: 0,
    store_views: 0,
    conversion_rate: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        const [statsRes, ordersRes, productsRes] = await Promise.all([
          api.get('/api/seller/stats').catch(() => ({ data: { success: true, data: { total_revenue: 0, total_orders: 0, store_views: 0, conversion_rate: 0 } } })),
          api.get('/api/orders/seller').catch(() => ({ data: { success: true, orders: [] } })),
          api.get(`/api/products?seller_id=${user?.id}`).catch(() => ({ data: { success: true, products: [] } }))
        ]);

        if (statsRes.data.success) setStatsData(statsRes.data.data);
        if (ordersRes.data.success) setRecentOrders(ordersRes.data.orders);
        if (productsRes.data.success) {
           const mapped = productsRes.data.products.map((p: any) => ({
             id: p._id,
             name: p.title,
             stock: p.total_inventory_count || 0,
             price: `$${p.base_price?.toFixed(2) || '0.00'}`,
             status: p.total_inventory_count > 10 ? 'Active' : p.total_inventory_count > 0 ? 'Low Stock' : 'Out of Stock'
           }));
           setProducts(mapped);
        }
      } catch (e) {
        console.error('Failed to fetch seller data:', e);
      }
    };
    if (user?.id) {
      fetchSellerData();
    }
  }, [user]);

  const stats = [
    { label: 'Total Revenue', value: `$${statsData.total_revenue.toLocaleString()}`, trend: '+14.5%', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Total Orders', value: statsData.total_orders.toString(), trend: '+5.2%', icon: ShoppingCart, color: 'text-brand-500', bg: 'bg-brand-100 dark:bg-brand-900/30' },
    { label: 'Store Views', value: statsData.store_views.toString(), trend: '+22.4%', icon: Users, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Conversion Rate', value: `${statsData.conversion_rate}%`, trend: '-1.2%', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] pt-24 pb-20 flex">
      
      {/* Sidebar */}
      <aside className="w-64 fixed h-[calc(100vh-6rem)] bg-white dark:bg-dark-800 border-r border-slate-200 dark:border-dark-700 hidden lg:flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white text-sm">SD</div>
            Seller Portal
          </h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-700'}`}>
            <LayoutDashboard className="w-5 h-5" /> Overview
          </button>
          <button onClick={() => setActiveTab('products')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'products' ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-700'}`}>
            <Package className="w-5 h-5" /> Products
          </button>
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-700'}`}>
            <ShoppingCart className="w-5 h-5" /> Orders
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-700'}`}>
            <BarChart3 className="w-5 h-5" /> Analytics
          </button>
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-dark-700">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-700 transition-all">
            <Settings className="w-5 h-5" /> Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white capitalize">{activeTab}</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your store and view performance.</p>
            </div>
            {activeTab === 'products' && (
              <button onClick={() => setActiveTab('add_product')} className="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-colors flex items-center gap-2">
                <Plus className="w-5 h-5" /> Add Product
              </button>
            )}
            {activeTab === 'add_product' && (
              <button onClick={() => setActiveTab('products')} className="px-6 py-3 bg-slate-100 dark:bg-dark-900 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-dark-800 transition-colors flex items-center gap-2">
                <ArrowLeft className="w-5 h-5" /> Back to Products
              </button>
            )}
          </header>

          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, idx) => (
                  <div key={idx} className="bg-white dark:bg-dark-800 rounded-3xl p-6 border border-slate-200 dark:border-dark-700 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <span className={`text-sm font-bold ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{stat.trend}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Chart Mock */}
                <div className="lg:col-span-2 bg-white dark:bg-dark-800 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-dark-700 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Overview</h3>
                    <select className="bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 outline-none">
                      <option>Last 7 Days</option>
                      <option>Last 30 Days</option>
                      <option>This Year</option>
                    </select>
                  </div>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                      <div key={i} className="w-full bg-brand-100 dark:bg-brand-900/30 rounded-t-xl relative group">
                        <div 
                          className="absolute bottom-0 w-full bg-brand-500 rounded-t-xl transition-all duration-1000 group-hover:bg-brand-400"
                          style={{ height: `${h}%` }}
                        ></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4 text-sm font-bold text-slate-400">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                  </div>
                </div>

                {/* Recent Orders List */}
                <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 border border-slate-200 dark:border-dark-700 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Recent Orders</h3>
                  <div className="space-y-4">
                    {recentOrders.map((order, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-900/50 transition-colors">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{order.customer}</p>
                          <p className="text-xs text-slate-500">{order.id} • {order.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{order.total}</p>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : order.status === 'Shipped' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30'}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-6 py-3 text-sm font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/10 rounded-xl transition-colors">
                    View All Orders
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-dark-700 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" placeholder="Search products..." className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <button className="px-4 py-3 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors">
                  <Filter className="w-4 h-4" /> Filter
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-dark-900/50 border-b border-slate-200 dark:border-dark-700">
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Product Name</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">SKU</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Stock</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Price</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-dark-700 hover:bg-slate-50 dark:hover:bg-dark-900/30 transition-colors">
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{p.name}</td>
                        <td className="p-4 text-sm text-slate-500">{p.id}</td>
                        <td className="p-4 font-medium text-slate-900 dark:text-white">{p.stock}</td>
                        <td className="p-4 font-medium text-slate-900 dark:text-white">{p.price}</td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${p.status === 'Active' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : p.status === 'Low Stock' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button className="text-brand-600 dark:text-brand-400 font-bold hover:underline text-sm">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'add_product' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700 shadow-sm p-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Create New Product</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Product Title</label>
                    <input type="text" {...register('title')} className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="e.g. Aura Premium ANC Headphones" />
                    {errors.title && <p className="text-red-500 text-xs mt-1 font-medium">{errors.title.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Brand</label>
                    <input type="text" {...register('brand')} className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="e.g. Aura" />
                    {errors.brand && <p className="text-red-500 text-xs mt-1 font-medium">{errors.brand.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                  <textarea {...register('description')} rows={4} className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none" placeholder="Detailed product description..."></textarea>
                  {errors.description && <p className="text-red-500 text-xs mt-1 font-medium">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Base Price ($)</label>
                    <input type="number" step="0.01" {...register('base_price', { valueAsNumber: true })} className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                    {errors.base_price && <p className="text-red-500 text-xs mt-1 font-medium">{errors.base_price.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Initial Inventory</label>
                    <input type="number" {...register('total_inventory_count', { valueAsNumber: true })} className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                    {errors.total_inventory_count && <p className="text-red-500 text-xs mt-1 font-medium">{errors.total_inventory_count.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Category</label>
                    <select {...register('category')} className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                      <option value="Electronics">Electronics</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Home">Home</option>
                      <option value="Sports">Sports</option>
                    </select>
                    {errors.category && <p className="text-red-500 text-xs mt-1 font-medium">{errors.category.message}</p>}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button type="submit" disabled={isSubmitting} className={`px-8 py-4 rounded-xl font-bold text-white transition-all flex items-center gap-2 ${isSubmitting ? 'bg-brand-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/30'}`}>
                    {isSubmitting ? (
                      <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Creating...</>
                    ) : (
                      <><Upload className="w-5 h-5" /> Publish Product</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {(activeTab === 'orders' || activeTab === 'analytics') && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-20 bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700 border-dashed text-center">
              <BarChart3 className="w-16 h-16 text-slate-300 dark:text-dark-600 mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Module under development</h2>
              <p className="text-slate-500">The detailed {activeTab} dashboard is scheduled for the next release cycle.</p>
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}
