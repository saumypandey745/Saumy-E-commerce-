"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '../store';
import { translations, Language, currencySymbols, conversionRates } from '../translations';
import { ShieldCheck, Lock, CreditCard, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getValidImageUrl } from '@/lib/imageFallback';

export default function CheckoutPage() {
  const { cart, cartTotal, language, currency, clearCart } = useAppStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [shippingAddress, setShippingAddress] = useState('123 Innovation Drive, San Francisco, 94103');
  const [cardNumber, setCardNumber] = useState('4111111111111111');

  const t = translations[language as Language];
  const symbol = currencySymbols[currency] || '$';
  const rate = conversionRates[currency] || 1;

  useEffect(() => {
    setMounted(true);
    if (cart.length === 0) {
      router.push('/cart');
    }
  }, [cart, router]);

  const formatPrice = (price: number) => `${symbol}${(price * rate).toFixed(2)}`;

  const subtotal = cartTotal();
  const shipping = subtotal > 150 ? 0 : 15.00;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleCheckout = async () => {
    setIsProcessing(true);
    setErrorMsg('');
    try {
      const res = await api.post('/api/v1/orders/checkout', {
        shipping_address: shippingAddress,
        card_number: cardNumber
      });
      
      if (res.data.success && res.data.order_id) {
        // Now get the Stripe Checkout Session URL
        const sessionRes = await api.post('/api/v1/payments/checkout-session', {
            order_id: res.data.order_id,
            amount: total,
            currency: currency.toLowerCase(),
            items: cart
        });

        if (sessionRes.data.success && sessionRes.data.url) {
            clearCart();
            window.location.href = sessionRes.data.url; // Redirect to Stripe
        } else {
            setErrorMsg('Failed to initialize payment gateway.');
        }
      } else {
        setErrorMsg(res.data.message || 'Checkout failed');
      }
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || e.message || 'Checkout failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted || cart.length === 0) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Checkout Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <Link href="/cart" className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 group">
            <span className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-dark-700 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors">←</span>
            Back to Cart
          </Link>
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
            <Lock className="w-4 h-4" /> Secure 256-bit SSL Checkout
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-12">

          {/* Left: Form Flow */}
          <div className="lg:col-span-7">

            {/* Step Indicators */}
            <div className="flex items-center gap-4 mb-8">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${step >= 1 ? 'bg-brand-600' : 'bg-slate-300 dark:bg-dark-700'}`}>
                  {step > 1 ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <span className="font-bold">Shipping Address</span>
              </div>
              <div className="h-px w-12 bg-slate-200 dark:bg-dark-700"></div>
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${step >= 2 ? 'bg-brand-600' : 'bg-slate-300 dark:bg-dark-700'}`}>
                  2
                </div>
                <span className="font-bold">Payment</span>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-sm border border-slate-200 dark:border-dark-700 p-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Shipping Information</h2>
                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">First Name</label>
                          <input type="text" required defaultValue="John" className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Last Name</label>
                          <input type="text" required defaultValue="Doe" className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Address</label>
                        <input type="text" required value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">City</label>
                          <input type="text" required defaultValue="San Francisco" className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Zip</label>
                          <input type="text" required defaultValue="94103" className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                        </div>
                      </div>
                      <button type="submit" className="w-full mt-6 bg-brand-600 text-white rounded-xl py-4 font-bold hover:bg-brand-700 transition-colors flex items-center justify-center gap-2">
                        Continue to Payment <ChevronRight className="w-4 h-4" />
                      </button>
                    </form>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Payment Method</h2>

                    <div className="space-y-4 mb-8">
                      <label className="flex items-center justify-between p-4 border-2 border-brand-500 bg-brand-50 dark:bg-brand-900/20 rounded-xl cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-4 border-brand-500 bg-white"></div>
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <CreditCard className="w-5 h-5" /> Credit / Debit Card
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <div className="w-8 h-5 bg-slate-200 dark:bg-dark-700 rounded text-[8px] flex items-center justify-center font-bold text-slate-500">VISA</div>
                          <div className="w-8 h-5 bg-slate-200 dark:bg-dark-700 rounded text-[8px] flex items-center justify-center font-bold text-slate-500">MC</div>
                        </div>
                      </label>

                      <label className="flex items-center justify-between p-4 border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 rounded-xl cursor-not-allowed opacity-50">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-dark-600 bg-white dark:bg-dark-800"></div>
                          <span className="font-bold text-slate-900 dark:text-white">PayPal</span>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-slate-200 dark:bg-dark-700 rounded">Unavailable</span>
                      </label>
                    </div>

                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleCheckout(); }}>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Card Number</label>
                        <input type="text" required value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none tracking-widest font-mono" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Expiry Date</label>
                          <input type="text" required defaultValue="12/28" className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">CVC</label>
                          <input type="password" required defaultValue="123" className="w-full bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                        </div>
                      </div>

                      {errorMsg && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium">
                          {errorMsg}
                        </div>
                      )}

                      <div className="flex gap-4 mt-8">
                        <button type="button" onClick={() => setStep(1)} className="px-6 py-4 bg-slate-100 dark:bg-dark-900 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-dark-700 transition-colors">
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isProcessing}
                          className={`flex-1 text-white rounded-xl py-4 font-bold flex items-center justify-center gap-2 transition-all ${isProcessing ? 'bg-brand-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/30'}`}
                        >
                          {isProcessing ? (
                            <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Processing...</>
                          ) : (
                            <><ShieldCheck className="w-5 h-5" /> Pay {formatPrice(total)}</>
                          )}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-5 mt-8 lg:mt-0">
            <div className="bg-slate-100 dark:bg-dark-800/50 rounded-3xl p-8 border border-slate-200 dark:border-dark-700 sticky top-24">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Order Summary</h3>

              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 hide-scrollbar">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 flex-shrink-0 relative">
                      <img src={getValidImageUrl(item.image, item.title)} alt={item.title} className="w-full h-full object-cover" />
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white dark:border-dark-800">{item.quantity}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">{item.title}</h4>
                      <p className="text-sm text-slate-500 mt-1">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <dl className="space-y-3 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-dark-700 pt-6">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="font-bold text-slate-900 dark:text-white">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Shipping</dt>
                  <dd className="font-bold text-slate-900 dark:text-white">{shipping === 0 ? 'Free' : formatPrice(shipping)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Taxes</dt>
                  <dd className="font-bold text-slate-900 dark:text-white">{formatPrice(tax)}</dd>
                </div>
                <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-dark-700 text-lg">
                  <dt className="font-black text-slate-900 dark:text-white">Total</dt>
                  <dd className="font-black text-brand-600 dark:text-brand-400">{formatPrice(total)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
