"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Package, Heart, Bell, Shield, LogOut, LayoutDashboard } from 'lucide-react';
import { useAppStore } from '../store';

const navItems = [
  { name: 'Dashboard', href: '/customer/dashboard', icon: LayoutDashboard },
  { name: 'My Profile', href: '/customer/profile', icon: User },
  { name: 'Orders & Returns', href: '/customer/orders', icon: Package },
  { name: 'Wishlist', href: '/customer/wishlist', icon: Heart },
  { name: 'Notifications', href: '/customer/notifications', icon: Bell },
  { name: 'Security', href: '/customer/security', icon: Shield },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-slate-200 dark:border-dark-700 p-6 sticky top-28">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                  {mounted ? (user?.name?.charAt(0).toUpperCase() || 'C') : 'C'}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{mounted ? (user?.name || 'Customer') : 'Customer'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{mounted ? user?.email : ''}</p>
                </div>
              </div>
              
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        isActive 
                          ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-medium' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-700'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                      {item.name}
                    </Link>
                  );
                })}
                
                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-dark-700">
                  <button 
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {children}
          </div>

        </div>
      </div>
    </div>
  );
}
