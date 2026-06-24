"use client";

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone, CreditCard, ShieldCheck, Truck } from 'lucide-react';
import { useAppStore } from '../app/store';
import { translations, Language } from '../app/translations';

export default function Footer() {
  const language = useAppStore((state) => state.language);
  const t = translations[language as Language];

  return (
    <footer className="bg-slate-50 dark:bg-[#0f172a] border-t border-slate-200 dark:border-white/5 pt-16 pb-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Newsletter & Value Props */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 border-b border-slate-200 dark:border-white/10 pb-12 mb-12">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Stay in the loop</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
              Subscribe to our newsletter and get 15% off your first purchase. Plus, receive exclusive offers and early access to new collections.
            </p>
            <form className="flex gap-2 max-w-md">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="flex-1 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                required
              />
              <button 
                type="submit"
                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-brand-500/20 transition-all active:scale-95 whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col items-start">
              <div className="w-12 h-12 bg-blue-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-xl flex items-center justify-center mb-4">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Free Delivery</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">On all orders over $150 across the globe.</p>
            </div>
            <div className="flex flex-col items-start">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Secure Payments</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">256-bit encryption for all your transactions.</p>
            </div>
            <div className="flex flex-col items-start">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-xl flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Money Back</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">30 days money-back guarantee no questions asked.</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-white overflow-hidden flex items-center justify-center">
                <img src="/logo.png" alt="Saumy E-commerce Logo" className="h-full w-full object-contain p-0.5" />
              </div>
              <span className="font-bold text-xl text-slate-900 dark:text-white">Saumy E-commerce<span className="text-brand-500">.</span></span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-xs">
              The premium destination for your electronic, fashion, and lifestyle needs. Redefining online shopping globally.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-brand-500 hover:text-white transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-brand-500 hover:text-white transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-brand-500 hover:text-white transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-brand-500 hover:text-white transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-sm">Shop</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/products?cat=electronics" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Electronics & Gadgets</Link></li>
              <li><Link href="/products?cat=fashion" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Fashion & Apparel</Link></li>
              <li><Link href="/products?cat=home" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Home & Furniture</Link></li>
              <li><Link href="/products?cat=beauty" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Health & Beauty</Link></li>
              <li><Link href="/products?cat=sports" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Sports & Outdoors</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-sm">{t.quickLinks}</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/about" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Careers</Link></li>
              <li><Link href="/stores" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Store Locations</Link></li>
              <li><Link href="/blog" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Our Blog</Link></li>
              <li><Link href="/reviews" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Customer Reviews</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-sm">{t.contact}</h4>
            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
                <span>123 Enterprise Blvd, Tech District<br/>San Francisco, CA 94103</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-brand-500 shrink-0" />
                <span>+1 (800) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-brand-500 shrink-0" />
                <span>support@saumy-ecommerce.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="md:col-span-1">
            {t.rightsReserved}
          </div>
          <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-slate-900 dark:hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
