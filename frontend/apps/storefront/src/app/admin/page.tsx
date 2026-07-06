"use client";

import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { api } from '@/lib/api';
import { ShieldAlert, Users, Store, Activity, AlertTriangle, CheckCircle, XCircle, Search, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const { language } = useAppStore();
  const [activeTab, setActiveTab] = useState('overview');

  const [statsData, setStatsData] = useState({
    total_revenue: 0,
    total_users: 0,
    total_products: 0,
    pending_approvals: 0,
    revenue_trend: []
  });

  const [moderationQueue, setModerationQueue] = useState<any[]>([]);
  const [pendingSellers, setPendingSellers] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/v1/admin/stats');
        if (res.data.success) {
          setStatsData(res.data.data);
        }
      } catch (e) {
        console.error('Failed to fetch admin stats:', e);
      }
    };
    const fetchModeration = async () => {
      try {
        const res = await api.get('/api/v1/admin/moderation').catch(() => ({ data: { success: true, queue: [] } }));
        if (res.data.success) {
          setModerationQueue(res.data.queue);
        }
      } catch (e) {
        console.error('Failed to fetch moderation queue:', e);
      }
    };
    const fetchPendingSellers = async () => {
      try {
        const res = await api.get('/api/v1/admin/sellers/pending').catch(() => ({ data: { success: true, sellers: [] } }));
        if (res.data.success) {
          setPendingSellers(res.data.sellers);
        }
      } catch (e) {
        console.error('Failed to fetch pending sellers:', e);
      }
    };
    fetchStats();
    fetchModeration();
    fetchPendingSellers();
  }, []);

  const handleSellerStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await api.put(`/api/v1/admin/sellers/${id}/status`, { status });
      if (res.data.success) {
        alert(`Seller marked as ${status}`);
        setPendingSellers(prev => prev.filter(s => s._id !== id));
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to update seller status');
    }
  };

  const stats = [
    { label: 'Platform Revenue', value: `$${(statsData.total_revenue / 1000).toFixed(1)}k`, trend: '+18.2%', icon: Activity, color: 'text-brand-500', bg: 'bg-brand-100 dark:bg-brand-900/30' },
    { label: 'Total Users', value: statsData.total_users.toLocaleString(), trend: '+4.1%', icon: Users, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Total Products', value: statsData.total_products.toLocaleString(), trend: '+12.4%', icon: Store, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Pending Moderation', value: statsData.pending_approvals.toString(), trend: statsData.pending_approvals > 0 ? 'Urgent' : 'All Clear', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] pt-24 pb-20 flex">
      
      {/* Sidebar */}
      <aside className="w-64 fixed h-[calc(100vh-6rem)] bg-slate-900 text-slate-300 hidden lg:flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-brand-500" />
            Admin Console
          </h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Activity className="w-5 h-5" /> Global Overview
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Users className="w-5 h-5" /> User Management
          </button>
          <button onClick={() => setActiveTab('vendors')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'vendors' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Store className="w-5 h-5" /> Vendor Management
          </button>
          <button onClick={() => setActiveTab('moderation')} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'moderation' ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
            <div className="flex items-center gap-3"><ShieldAlert className="w-5 h-5" /> Moderation</div>
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{statsData.pending_approvals}</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          
          <header className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white capitalize">{activeTab}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Platform moderation and global analytics.</p>
          </header>

          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, idx) => (
                  <div key={idx} className="bg-white dark:bg-dark-800 rounded-3xl p-6 border border-slate-200 dark:border-dark-700 shadow-sm relative overflow-hidden">
                    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${stat.bg} opacity-50 blur-xl`}></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <span className={`text-sm font-bold ${stat.trend === 'Urgent' || stat.trend.startsWith('-') ? 'text-red-500' : 'text-emerald-500'}`}>{stat.trend}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1 relative z-10">{stat.label}</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white relative z-10">{stat.value}</h3>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Global Revenue Chart using Real Data */}
                <div className="lg:col-span-2 bg-white dark:bg-dark-800 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-dark-700 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Platform Revenue (Last 7 Days)</h3>
                  <div className="h-64 flex items-end justify-between gap-1 sm:gap-2">
                    {statsData.revenue_trend && statsData.revenue_trend.length > 0 ? (
                      statsData.revenue_trend.map((trend: any, i: number) => {
                        // Max value for scaling
                        const maxRev = Math.max(...statsData.revenue_trend.map((t: any) => t.daily_revenue || 1));
                        const heightPercent = Math.max(10, ((trend.daily_revenue || 0) / maxRev) * 100);
                        return (
                          <div key={i} className="w-full bg-slate-100 dark:bg-dark-900 rounded-t-xl relative group flex flex-col items-center">
                            <div 
                              className="absolute bottom-0 w-full bg-brand-400 dark:bg-brand-600 rounded-t-xl transition-all duration-1000 group-hover:bg-brand-500"
                              style={{ height: `${heightPercent}%` }}
                            ></div>
                            <span className="absolute -bottom-6 text-[10px] text-slate-500">{new Date(trend.date).toLocaleDateString(undefined, {weekday: 'short'})}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">No revenue data available</div>
                    )}
                  </div>
                </div>

                {/* Action Queue */}
                <div className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-6 border border-red-200 dark:border-red-900/30">
                  <h3 className="text-lg font-bold text-red-900 dark:text-red-400 mb-6 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> Action Required
                  </h3>
                  <div className="space-y-4">
                    {moderationQueue.map((mod, i) => (
                      <div key={i} className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{mod.type}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${mod.risk === 'High' ? 'bg-red-100 text-red-600' : mod.risk === 'Medium' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>{mod.risk} Risk</span>
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm mb-3">{mod.subject}</p>
                        <div className="flex gap-2">
                          <button className="flex-1 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> Approve</button>
                          <button className="flex-1 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"><XCircle className="w-3 h-3" /> Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {activeTab === 'vendors' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-dark-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Seller Verification Queue</h3>
                <p className="text-slate-500 text-sm">Review newly onboarded sellers and verify their KYC documents.</p>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-900/50 text-xs uppercase text-slate-500 border-b border-slate-200 dark:border-dark-700">
                    <th className="p-4 font-bold">Store Name</th>
                    <th className="p-4 font-bold">Email</th>
                    <th className="p-4 font-bold">Registration / Tax ID</th>
                    <th className="p-4 font-bold">Documents</th>
                    <th className="p-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {pendingSellers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">No pending seller registrations.</td>
                    </tr>
                  ) : (
                    pendingSellers.map(seller => (
                      <tr key={seller._id} className="border-b border-slate-200 dark:border-dark-700 hover:bg-slate-50 dark:hover:bg-dark-900/20">
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{seller.store_name}</td>
                        <td className="p-4 text-slate-500">{seller.contact_email}</td>
                        <td className="p-4 font-mono text-slate-500">{seller.business_registration_number} <br/> <span className="text-xs">{seller.tax_id}</span></td>
                        <td className="p-4">
                          {seller.documents && seller.documents.length > 0 ? (
                            <div className="flex gap-2">
                              {seller.documents.map((doc: any, i: number) => (
                                <a key={i} href={doc.url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline text-xs font-bold">Doc {i+1}</a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-orange-500 font-bold">No Docs Uploaded</span>
                          )}
                        </td>
                        <td className="p-4 flex gap-2">
                          <button onClick={() => handleSellerStatusUpdate(seller._id, 'APPROVED')} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all">Approve</button>
                          <button onClick={() => handleSellerStatusUpdate(seller._id, 'REJECTED')} className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all">Reject</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </motion.div>
          )}

          {(activeTab === 'users' || activeTab === 'moderation') && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-20 bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700 border-dashed text-center">
              <ShieldAlert className="w-16 h-16 text-slate-300 dark:text-dark-600 mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Administrative Sandbox</h2>
              <p className="text-slate-500">The detailed {activeTab} management tables are restricted in this preview environment.</p>
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}
