"use client";

import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { translations, Language, currencySymbols, conversionRates } from '../translations';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Tag, CheckCircle2, Info, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal, language, currency } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [discount, setDiscount] = useState(0);

  const t = translations[language as Language];
  const symbol = currencySymbols[currency] || '$';
  const rate = conversionRates[currency] || 1;

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatPrice = (price: number) => {
    return `${symbol}${(price * rate).toFixed(2)}`;
  };

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'WELCOME10') {
      setPromoStatus('success');
      setDiscount(0.10); // 10% off
    } else if (promoCode.toUpperCase() === 'MINUS50') {
      setPromoStatus('success');
      setDiscount(50 / cartTotal()); // flat 50 off
    } else {
      setPromoStatus('error');
      setDiscount(0);
    }
  };

  if (!mounted) return null; // Hydration guard

  const subtotal = cartTotal();
  const calculatedDiscount = subtotal * discount;
  const shippingTarget = 150;
  const shipping = subtotal > shippingTarget ? 0 : 15.00;
  const tax = (subtotal - calculatedDiscount) * 0.08;
  const total = (subtotal - calculatedDiscount) + shipping + tax;
  
  const progressPercent = Math.min((subtotal / shippingTarget) * 100, 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] transition-colors pt-24 pb-20">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
            {language === 'en' ? 'Your Shopping Cart' : 'Twój Koszyk'}
          </h1>
          <Link href="/products" className="text-brand-600 dark:text-brand-400 hover:text-brand-700 font-bold flex items-center gap-1">
            {language === 'en' ? 'Continue Shopping' : 'Kontynuuj zakupy'} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {cart.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-dark-800 rounded-3xl shadow-sm border border-slate-200 dark:border-dark-700 p-16 text-center max-w-2xl mx-auto mt-12"
          >
            <div className="w-24 h-24 bg-slate-100 dark:bg-dark-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <ShoppingBag className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              {language === 'en' ? 'Your cart is empty' : 'Twój koszyk jest pusty'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg">
              {language === 'en' ? 'Looks like you haven\'t added any premium gear to your cart yet. Discover our latest collections.' : 'Wygląda na to, że nie dodałeś jeszcze żadnych produktów do koszyka.'}
            </p>
            <Link 
              href="/products"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/30 transition-all active:scale-95"
            >
              {language === 'en' ? 'Start Exploring' : 'Rozpocznij zakupy'}
            </Link>
          </motion.div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            
            {/* Left: Cart Items */}
            <div className="lg:col-span-8">
              
              {/* Shipping Progress Bar */}
              <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-slate-200 dark:border-dark-700 p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${subtotal >= shippingTarget ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400'}`}>
                    {subtotal >= shippingTarget ? <CheckCircle2 className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {subtotal >= shippingTarget 
                      ? "You've unlocked Free Global Shipping!" 
                      : `You're ${formatPrice(shippingTarget - subtotal)} away from Free Shipping!`}
                  </p>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-dark-900 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`h-full ${subtotal >= shippingTarget ? 'bg-emerald-500' : 'bg-brand-500'}`}
                  ></motion.div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 shadow-sm rounded-3xl border border-slate-200 dark:border-dark-700 overflow-hidden">
                <ul className="divide-y divide-slate-100 dark:divide-dark-700">
                  <AnimatePresence>
                    {cart.map((item) => (
                      <motion.li 
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        key={item.id} 
                        className="p-6 flex flex-col sm:flex-row items-center gap-6 group hover:bg-slate-50 dark:hover:bg-dark-900/50 transition-colors"
                      >
                        <Link href={`/products/${item.id}`} className="w-28 h-28 flex-shrink-0 bg-slate-100 dark:bg-dark-900 rounded-2xl overflow-hidden relative border border-slate-200 dark:border-dark-700 shadow-sm block">
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-500"
                          />
                        </Link>
                        
                        <div className="flex-1 flex flex-col justify-between w-full">
                          <div className="flex justify-between items-start">
                            <Link href={`/products/${item.id}`}>
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                                {item.title}
                              </h3>
                              <p className="mt-1 text-sm font-bold tracking-widest text-brand-500 uppercase">
                                {item.category}
                              </p>
                            </Link>
                            <p className="text-xl font-black text-slate-900 dark:text-white ml-4">
                              {formatPrice(item.price)}
                            </p>
                          </div>
                          
                          <div className="mt-6 flex items-center justify-between">
                            <div className="flex items-center border border-slate-200 dark:border-dark-600 rounded-xl bg-white dark:bg-dark-800 shadow-sm">
                              <button 
                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-dark-700 rounded-l-xl transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-10 text-center font-bold text-slate-900 dark:text-white border-x border-slate-200 dark:border-dark-600 flex items-center justify-center h-10">
                                {item.quantity}
                              </span>
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-dark-700 rounded-r-xl transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="text-slate-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 text-sm font-bold"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="hidden sm:inline">Remove</span>
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-4 mt-8 lg:mt-0">
              <div className="bg-white dark:bg-dark-800 shadow-xl rounded-3xl border border-slate-200 dark:border-dark-700 p-8 sticky top-24">
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  {language === 'en' ? 'Order Summary' : 'Podsumowanie'}
                </h2>
                
                <dl className="space-y-4 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-dark-700 pb-6 mb-6">
                  <div className="flex items-center justify-between">
                    <dt className="font-medium">{language === 'en' ? 'Subtotal' : 'Suma częściowa'}</dt>
                    <dd className="font-bold text-slate-900 dark:text-white">{formatPrice(subtotal)}</dd>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                      <dt className="font-medium">Discount applied</dt>
                      <dd className="font-bold">-{formatPrice(calculatedDiscount)}</dd>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <dt className="font-medium flex items-center gap-1">
                      {language === 'en' ? 'Shipping' : 'Wysyłka'}
                      <div className="group relative cursor-pointer">
                        <Info className="w-4 h-4 text-slate-400" />
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-slate-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                          Free shipping on orders over {symbol}{shippingTarget}
                        </div>
                      </div>
                    </dt>
                    <dd className="font-bold text-slate-900 dark:text-white">
                      {shipping === 0 ? <span className="text-emerald-500 uppercase tracking-wider text-xs">Free</span> : formatPrice(shipping)}
                    </dd>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <dt className="font-medium">{language === 'en' ? 'Estimated Tax' : 'Szacowany podatek'}</dt>
                    <dd className="font-bold text-slate-900 dark:text-white">{formatPrice(tax)}</dd>
                  </div>
                </dl>

                {/* Promo Code Section */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Promo Code
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. WELCOME10" 
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className={`flex-1 bg-slate-50 dark:bg-dark-900 border ${promoStatus === 'error' ? 'border-red-300 dark:border-red-500/50 focus:ring-red-500' : promoStatus === 'success' ? 'border-emerald-300 dark:border-emerald-500/50 focus:ring-emerald-500' : 'border-slate-200 dark:border-dark-600 focus:ring-brand-500'} rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 outline-none transition-all uppercase`}
                    />
                    <button 
                      onClick={handleApplyPromo}
                      className="px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {promoStatus === 'error' && <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Invalid or expired promo code.</p>}
                  {promoStatus === 'success' && <p className="text-xs text-emerald-500 mt-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Promo code applied successfully!</p>}
                </div>

                <div className="flex items-center justify-between mb-8">
                  <dt className="text-lg font-bold text-slate-900 dark:text-white">Total</dt>
                  <dd className="text-3xl font-black text-brand-600 dark:text-brand-400">
                    {formatPrice(total)}
                  </dd>
                </div>

                <Link
                  href="/checkout"
                  className="w-full bg-brand-600 border border-transparent rounded-xl shadow-lg py-4 px-4 text-base font-bold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all shadow-brand-500/30 flex items-center justify-center gap-2 active:scale-95"
                >
                  {language === 'en' ? 'Secure Checkout' : 'Przejdź do kasy'}
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4 flex items-center justify-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center"><CheckCircle2 className="w-2 h-2" /></span>
                  256-bit encrypted checkout
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Truck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </svg>
  )
}
