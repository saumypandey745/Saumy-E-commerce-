import { Shield, Lock, Server, Key, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 mb-6 shadow-xl">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
            Enterprise Grade <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-purple-500">Security</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Your trust is our top priority. We use military-grade encryption and advanced fraud prevention algorithms to ensure your data and transactions are absolutely safe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 border border-slate-200 dark:border-dark-700 shadow-lg relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl group-hover:bg-brand-500/20 transition-all"></div>
            <Lock className="w-8 h-8 text-brand-500 mb-6" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">256-Bit SSL Encryption</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Every single connection made to our servers is secured using state-of-the-art 256-bit SSL encryption. Your personal data never travels in plain text.
            </p>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 border border-slate-200 dark:border-dark-700 shadow-lg relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
            <Server className="w-8 h-8 text-purple-500 mb-6" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">PCI-DSS Compliant Servers</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Our payment infrastructure meets the strictest Payment Card Industry Data Security Standards (PCI-DSS). We do not store your raw credit card information on our servers.
            </p>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 border border-slate-200 dark:border-dark-700 shadow-lg relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
            <Key className="w-8 h-8 text-emerald-500 mb-6" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Zero-Trust Architecture</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We employ a zero-trust architecture across all microservices. Every internal API request is authenticated, authorized, and continuously monitored for anomalies.
            </p>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 border border-slate-200 dark:border-dark-700 shadow-lg relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
            <CheckCircle className="w-8 h-8 text-rose-500 mb-6" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">AI Fraud Prevention</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Our machine learning models analyze millions of data points in real-time to detect and block fraudulent transactions before they even happen.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/products" className="inline-flex items-center justify-center rounded-full bg-slate-900 dark:bg-white px-8 py-4 text-sm font-bold text-white dark:text-slate-900 hover:scale-105 transition-transform shadow-xl">
            Shop Safely Now
          </Link>
        </div>
      </div>
    </div>
  );
}
