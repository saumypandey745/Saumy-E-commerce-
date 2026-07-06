"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import { ArrowRight, Sparkles, MessageSquare, Send, X, Bot, User, Clock, ChevronLeft, ChevronRight, Zap, Shield, Gift } from 'lucide-react';
import { useAppStore } from './store';
import { translations, Language } from './translations';
import Link from 'next/link';
import { getValidImageUrl } from '@/lib/imageFallback';
import { api } from '@/lib/api';

// No mock fallback arrays needed. We fetch all data dynamically.

const categories = [
  { name: 'Smartphones', icon: '📱', color: 'from-blue-500 to-cyan-500' },
  { name: 'Laptops', icon: '💻', color: 'from-purple-500 to-pink-500' },
  { name: 'Headphones', icon: '🎧', color: 'from-emerald-500 to-teal-500' },
  { name: 'Smart Watches', icon: '⌚', color: 'from-orange-500 to-amber-500' },
  { name: 'Gaming Accessories', icon: '🎮', color: 'from-red-500 to-rose-500' },
  { name: 'Cameras', icon: '📷', color: 'from-indigo-500 to-blue-500' }
];

export default function Home() {
  const { language } = useAppStore();
  const t = translations[language as Language];

  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 45, seconds: 30 });
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/api/v1/products');
        if (res.data.success && res.data.products.length > 0) {
           const mapped = res.data.products.map((p: any) => ({
             id: p._id,
             title: p.title,
             price: p.base_price,
             base_price: p.base_price,
             image: getValidImageUrl(
              p.images && p.images.length > 0 ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0].url) : p.image,
              p.category ? p.category.name || p.category : p.title
            ),
             category: p.category,
             rating: 4.5,
             reviews: 0,
             badge: p.status === 'NEW' ? 'New Arrival' : undefined
           }));
           setFeaturedProducts(mapped.slice(0, 4));
           setTrending(mapped.slice(0, 4).reverse());
        }
      } catch (err) {
        console.error("Failed to fetch products for homepage", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Chatbot states removed (using global layout chatbot)

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Removed handleSendMessage

  return (
    <div className="relative min-h-screen">
      
      {/* Dynamic Hero Slider */}
      <section className="relative w-full h-[600px] lg:h-[700px] mb-16 overflow-hidden rounded-3xl group">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center transition-transform duration-10000 hover:scale-105"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-transparent"></div>
        
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-white uppercase tracking-widest">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>{t.discover}</span>
              </div>
              <h1 className="mb-6 text-5xl md:text-7xl font-black tracking-tight text-white leading-[1.1]">
                {t.heroTitle} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-500">{t.heroTitleSpan}</span>
              </h1>
              <p className="mb-10 text-lg md:text-xl text-slate-300 font-medium leading-relaxed">
                {t.heroSub}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/products" className="flex items-center gap-2 rounded-full bg-brand-600 px-8 py-4 font-bold text-white transition-all hover:bg-brand-700 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(59,130,246,0.8)]">
                  {t.startExploring} <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/products?cat=trending" className="rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-8 py-4 font-bold text-white transition-all hover:bg-white/20 hover:-translate-y-1">
                  {t.viewCollections}
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Category Scroll */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Shop by Category</h2>
            <div className="flex gap-2 hidden sm:flex">
              <button className="w-10 h-10 rounded-full bg-slate-100 dark:bg-dark-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-brand-500 hover:text-white transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <button className="w-10 h-10 rounded-full bg-slate-100 dark:bg-dark-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-brand-500 hover:text-white transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar">
            {categories.map((cat, i) => (
              <Link href={`/products?cat=${encodeURIComponent(cat.name.toLowerCase())}`} key={i} className="flex-shrink-0 group">
                <div className="w-32 h-32 rounded-2xl bg-white dark:bg-dark-800 shadow-sm border border-slate-200 dark:border-dark-700 flex flex-col items-center justify-center gap-3 transition-transform group-hover:-translate-y-2 group-hover:shadow-xl">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${cat.color} flex items-center justify-center text-2xl shadow-lg`}>
                    {cat.icon}
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-brand-600 dark:group-hover:text-brand-400">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Flash Sale Banner */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20 rounded-3xl overflow-hidden relative shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-500 z-0"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>
          <div className="relative z-10 px-8 py-12 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-white text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <Zap className="w-6 h-6 text-yellow-300" />
                <span className="font-bold tracking-wider uppercase text-sm">Flash Sale</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-4">Up to 60% Off</h2>
              <p className="text-red-100 font-medium text-lg max-w-md">Grab the hottest electronics and gadgets before the timer runs out!</p>
            </div>
            
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-red-600 font-black text-2xl shadow-inner">{String(timeLeft.hours).padStart(2, '0')}</div>
                <span className="text-white text-xs font-bold uppercase mt-2 block">Hours</span>
              </div>
              <span className="text-white font-black text-2xl -mt-6">:</span>
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-red-600 font-black text-2xl shadow-inner">{String(timeLeft.minutes).padStart(2, '0')}</div>
                <span className="text-white text-xs font-bold uppercase mt-2 block">Mins</span>
              </div>
              <span className="text-white font-black text-2xl -mt-6">:</span>
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-red-600 font-black text-2xl shadow-inner">{String(timeLeft.seconds).padStart(2, '0')}</div>
                <span className="text-white text-xs font-bold uppercase mt-2 block">Secs</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Featured Products */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t.curatedPicks}</h2>
              <p className="text-slate-600 dark:text-slate-400">{t.handSelected}</p>
            </div>
            <Link href="/products" className="group hidden sm:flex items-center gap-2 font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors">
              View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {loading ? (
              Array.from({length: 4}).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p className="text-slate-500 col-span-full">No featured products found.</p>
            )}
          </div>
        </section>

        {/* Value Proposition Banners */}
        <section className="mb-20 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-3xl bg-slate-100 dark:bg-dark-800 p-8 md:p-12 relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl group-hover:bg-brand-500/20 transition-colors"></div>
            <Shield className="w-10 h-10 text-brand-500 mb-6" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Enterprise Grade Security</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-sm">Shop with confidence. Our checkout process is secured by 256-bit encryption and advanced fraud protection.</p>
            <Link href="/security" className="font-bold text-brand-600 dark:text-brand-400 flex items-center gap-2 hover:gap-3 transition-all">
              Learn More <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="rounded-3xl bg-purple-50 dark:bg-purple-900/10 p-8 md:p-12 relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors"></div>
            <Gift className="w-10 h-10 text-purple-500 mb-6" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Loyalty Rewards Program</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-sm">Earn points on every purchase. Redeem them for exclusive discounts, free shipping, and early access.</p>
            <Link href="/rewards" className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2 hover:gap-3 transition-all">
              Join Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Trending Now */}
        <section className="mb-24">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 rounded-full bg-red-100 dark:bg-red-500/20 text-xs font-bold text-red-600 dark:text-red-400 uppercase">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>
                Hot Right Now
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Trending Products</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {loading ? (
              Array.from({length: 4}).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            ) : trending.length > 0 ? (
              trending.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p className="text-slate-500 col-span-full">No trending products found.</p>
            )}
          </div>
        </section>

      </div>

      {/* Removed duplicate chatbot from home page */}

    </div>
  );
}
