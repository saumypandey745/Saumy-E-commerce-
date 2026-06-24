import { Gift, Star, Award, TrendingUp, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function RewardsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl z-0 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-6 shadow-xl border border-purple-200 dark:border-purple-800">
              <Gift className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
              Saumy E-commerce <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Rewards</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Join our exclusive loyalty program and turn every purchase into points. Redeem your points for massive discounts, free expedited shipping, and VIP early access to new product drops.
            </p>
          </div>
        </div>

        {/* Tiers Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 border border-slate-200 dark:border-dark-700 shadow-sm hover:shadow-xl transition-shadow text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-dark-700 flex items-center justify-center mb-4">
              <Star className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Silver Tier</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">0 - 499 Points</p>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 text-left w-full border-t border-slate-100 dark:border-dark-700 pt-4">
              <li className="flex gap-2"><Sparkles className="w-4 h-4 text-brand-500 shrink-0" /> Earn 1 pt per $1</li>
              <li className="flex gap-2"><Sparkles className="w-4 h-4 text-brand-500 shrink-0" /> Birthday Bonus (50 pts)</li>
            </ul>
          </div>

          <div className="bg-gradient-to-b from-brand-50 to-white dark:from-brand-900/20 dark:to-dark-800 rounded-3xl p-6 border-2 border-brand-500 dark:border-brand-400 shadow-lg hover:shadow-2xl transition-shadow text-center flex flex-col items-center relative transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">Most Popular</div>
            <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center mb-4 mt-2">
              <Award className="w-8 h-8 text-brand-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Gold Tier</h3>
            <p className="text-sm text-brand-600 dark:text-brand-400 font-medium mb-4">500 - 1,999 Points</p>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 text-left w-full border-t border-brand-100 dark:border-brand-900/30 pt-4">
              <li className="flex gap-2"><Sparkles className="w-4 h-4 text-brand-500 shrink-0" /> Earn 1.5 pts per $1</li>
              <li className="flex gap-2"><Sparkles className="w-4 h-4 text-brand-500 shrink-0" /> Birthday Bonus (100 pts)</li>
              <li className="flex gap-2"><Sparkles className="w-4 h-4 text-brand-500 shrink-0" /> Free Standard Shipping</li>
            </ul>
          </div>

          <div className="bg-gradient-to-b from-purple-50 to-white dark:from-purple-900/20 dark:to-dark-800 rounded-3xl p-6 border border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-xl transition-shadow text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Platinum Tier</h3>
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-4">2,000+ Points</p>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 text-left w-full border-t border-purple-100 dark:border-purple-900/30 pt-4">
              <li className="flex gap-2"><Sparkles className="w-4 h-4 text-purple-500 shrink-0" /> Earn 2 pts per $1</li>
              <li className="flex gap-2"><Sparkles className="w-4 h-4 text-purple-500 shrink-0" /> Birthday Bonus (250 pts)</li>
              <li className="flex gap-2"><Sparkles className="w-4 h-4 text-purple-500 shrink-0" /> Free Expedited Shipping</li>
              <li className="flex gap-2"><Sparkles className="w-4 h-4 text-purple-500 shrink-0" /> VIP Early Access</li>
            </ul>
          </div>
        </div>

        <div className="bg-slate-900 dark:bg-white rounded-3xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <h2 className="text-3xl font-black text-white dark:text-slate-900 mb-4 relative z-10">Ready to start earning?</h2>
          <p className="text-slate-300 dark:text-slate-600 mb-8 max-w-lg mx-auto relative z-10">
            Create an account today and instantly receive 100 bonus points as a welcome gift.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <Link href="/auth/register" className="inline-flex items-center justify-center rounded-full bg-brand-500 hover:bg-brand-600 px-8 py-4 text-sm font-bold text-white transition-transform hover:scale-105">
              Join Rewards Program
            </Link>
            <Link href="/auth/login" className="inline-flex items-center justify-center rounded-full bg-white/10 dark:bg-slate-900/10 hover:bg-white/20 dark:hover:bg-slate-900/20 px-8 py-4 text-sm font-bold text-white dark:text-slate-900 transition-colors border border-white/20 dark:border-slate-900/20">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
