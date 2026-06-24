"use client";

import { Store, TrendingUp, Users, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function SellerMarketingPage() {
  const sellerHubUrl = '/seller/dashboard';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-600/20 to-purple-600/20 z-0"></div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-semibold mb-6"
            >
              <Sparkles className="w-4 h-4" /> Global Marketplace Platform
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6"
            >
              Turn your passion into <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">profit.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-300 mb-10 max-w-2xl leading-relaxed"
            >
              Join millions of sellers on Saumy E-commerce. Get access to powerful tools, global reach, and everything you need to scale your business.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <a 
                href={sellerHubUrl} 
                className="flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-1"
              >
                Start Selling <ArrowRight className="w-5 h-5" />
              </a>
              <Link 
                href="/auth/login" 
                className="flex items-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl font-bold text-lg transition-all"
              >
                Login to Seller Hub
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">Why sell with us?</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">Everything you need to manage your inventory, process orders, and connect with millions of active shoppers globally.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-dark-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-dark-700 hover:shadow-xl transition-shadow group">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Store className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Custom Storefront</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Build your unique brand identity with customizable store profiles, banner images, and flexible policies.
            </p>
          </div>

          <div className="bg-white dark:bg-dark-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-dark-700 hover:shadow-xl transition-shadow group">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Powerful Analytics</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Track your revenue, monitor conversion rates, and discover your best-selling items with our comprehensive dashboard.
            </p>
          </div>

          <div className="bg-white dark:bg-dark-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-dark-700 hover:shadow-xl transition-shadow group">
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Secure Ecosystem</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Fraud protection, secure payouts, and automated KYC verification ensure a safe environment for your business.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-brand-600 rounded-3xl overflow-hidden relative shadow-2xl">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="p-12 lg:p-20 text-center relative z-10">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">Ready to reach millions?</h2>
            <p className="text-brand-100 text-lg lg:text-xl max-w-2xl mx-auto mb-10">
              Set up your store in minutes. No credit card required. Free listing for your first 50 items.
            </p>
            <a 
              href={sellerHubUrl} 
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand-600 hover:bg-slate-50 rounded-xl font-bold text-lg transition-transform hover:-translate-y-1 shadow-lg"
            >
              Open Your Store
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
