"use client";

import { useState } from 'react';
import { useAppStore } from '../store';
import { User, Package, MapPin, CreditCard, Settings, LogOut, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isLoggedIn, logout } = useAppStore();
  const [activeTab, setActiveTab] = useState('orders');

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f172a] pt-24">
        <User className="w-16 h-16 text-slate-300 dark:text-dark-600 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Please log in to view your profile</h2>
        <Link href="/auth/login" className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] pt-24 pb-20">
      
      {/* Header */}
      <div className="bg-brand-600 dark:bg-dark-800 text-white pb-20 pt-10 px-4 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl font-black shadow-lg">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-black mb-1">{user?.name}</h1>
            <p className="text-brand-100 dark:text-slate-400 font-medium">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Sidebar */}
          <div className="md:col-span-3">
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-slate-200 dark:border-dark-700 overflow-hidden">
              <nav className="flex flex-col">
                <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-3 p-4 text-sm font-bold transition-colors ${activeTab === 'orders' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border-l-4 border-brand-500' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-900 border-l-4 border-transparent'}`}>
                  <Package className="w-5 h-5" /> Order History
                </button>
                <button onClick={() => setActiveTab('addresses')} className={`flex items-center gap-3 p-4 text-sm font-bold transition-colors ${activeTab === 'addresses' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border-l-4 border-brand-500' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-900 border-l-4 border-transparent'}`}>
                  <MapPin className="w-5 h-5" /> Saved Addresses
                </button>
                <button onClick={() => setActiveTab('payment')} className={`flex items-center gap-3 p-4 text-sm font-bold transition-colors ${activeTab === 'payment' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border-l-4 border-brand-500' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-900 border-l-4 border-transparent'}`}>
                  <CreditCard className="w-5 h-5" /> Payment Methods
                </button>
                <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-3 p-4 text-sm font-bold transition-colors ${activeTab === 'settings' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border-l-4 border-brand-500' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-900 border-l-4 border-transparent'}`}>
                  <Settings className="w-5 h-5" /> Account Settings
                </button>
                <div className="border-t border-slate-200 dark:border-dark-700 my-2"></div>
                <button onClick={() => logout()} className="flex items-center gap-3 p-4 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border-l-4 border-transparent">
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-9">
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-slate-200 dark:border-dark-700 p-8 min-h-[500px]">
              
              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Order History</h2>
                  
                  {/* Mock Order */}
                  <div className="border border-slate-200 dark:border-dark-700 rounded-xl overflow-hidden mb-6">
                    <div className="bg-slate-50 dark:bg-dark-900 p-4 border-b border-slate-200 dark:border-dark-700 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Order Placed</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">June 18, 2026</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">$388.79</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Order #</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">ORD-592811</p>
                      </div>
                      <Link href="#" className="text-sm font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700">View Invoice</Link>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2"><Package className="w-5 h-5" /> Delivered on June 20, 2026</h4>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-dark-900 rounded-xl overflow-hidden border border-slate-200 dark:border-dark-700">
                          <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white line-clamp-1">Aura Premium ANC Headphones (Midnight Blue)</p>
                          <p className="text-sm text-slate-500">Qty: 1</p>
                        </div>
                        <div className="ml-auto flex gap-2">
                          <button className="px-4 py-2 border border-slate-200 dark:border-dark-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">Return Item</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'addresses' && (
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Saved Addresses</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 border-brand-500 bg-brand-50 dark:bg-brand-900/10 rounded-xl p-6 relative">
                      <span className="absolute top-4 right-4 text-xs font-bold px-2 py-1 bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 rounded">Default</span>
                      <p className="font-bold text-slate-900 dark:text-white mb-2">{user.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">123 Innovation Drive<br/>Apt 4B<br/>San Francisco, CA 94103<br/>United States</p>
                      <div className="flex gap-4">
                        <button className="text-sm font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700">Edit</button>
                      </div>
                    </div>
                    <button className="border-2 border-dashed border-slate-300 dark:border-dark-600 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:text-brand-600 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors min-h-[200px]">
                      <Plus className="w-8 h-8 mb-2" />
                      <span className="font-bold">Add New Address</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'payment' && (
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Payment Methods</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-slate-200 dark:border-dark-700 rounded-xl p-6 relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-8 bg-slate-900 text-white text-[10px] font-bold rounded flex items-center justify-center">VISA</div>
                        <p className="font-mono text-slate-900 dark:text-white font-bold tracking-widest">•••• 4242</p>
                      </div>
                      <p className="text-sm text-slate-500 mb-4">Expires 12/28</p>
                      <div className="flex gap-4">
                        <button className="text-sm font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700">Edit</button>
                        <button className="text-sm font-bold text-red-600 hover:text-red-700">Remove</button>
                      </div>
                    </div>
                    <button className="border-2 border-dashed border-slate-300 dark:border-dark-600 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:text-brand-600 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors min-h-[160px]">
                      <Plus className="w-8 h-8 mb-2" />
                      <span className="font-bold">Add Payment Method</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Account Settings</h2>
                  <form className="max-w-md space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                      <input type="text" defaultValue={user.name} className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                      <input type="email" defaultValue={user.email} className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                      <input type="password" placeholder="Leave blank to keep current" className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                    <button type="button" className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl mt-4">
                      Save Changes
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
