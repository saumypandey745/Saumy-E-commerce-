"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, User, Search, Menu, X, Globe, Heart, Package, LogOut, Sun, Moon, ChevronDown, Bell } from 'lucide-react';
import { useAppStore } from '../app/store';
import { translations, Language, Currency } from '../app/translations';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

export default function Header() {
  const { language, currency, setLanguage, setCurrency, cartCount, fetchCart, isLoggedIn, user, logout, wishlist, searchQuery, setSearchQuery } = useAppStore();
  const t = translations[language as Language];
  const { theme, setTheme } = useTheme();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);

  const count = cartCount();

  // Handle Hydration mismatch for next-themes and Zustand
  useEffect(() => {
    setMounted(true);
    fetchCart();
  }, []);

  // Scroll effect for sticky glassmorphism header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setMegaMenuOpen(false);
  }, [pathname]);

  // Live search suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchSuggestions([]);
        return;
      }
      try {
        const res = await api.get(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
        if (res.data.success) {
          setSearchSuggestions(res.data.data.products || []);
        }
      } catch (err) {
        console.error('Failed to fetch search suggestions', err);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 shadow-sm' 
        : 'bg-white dark:bg-[#0f172a] border-b border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Logo & Mega Menu Trigger */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-500 to-purple-500 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 group-hover:rotate-3">
              <span className="font-bold text-white text-lg">E</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white hidden sm:block">eComm<span className="text-brand-500">.</span></span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            <div 
              className="relative"
              onMouseEnter={() => setMegaMenuOpen(true)}
              onMouseLeave={() => setMegaMenuOpen(false)}
            >
              <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                Categories <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${megaMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Mega Menu Dropdown */}
              <AnimatePresence>
                {megaMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 w-[600px] pt-4"
                  >
                    <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-dark-700 p-6 grid grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4">Electronics</h4>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                          <li><Link href="/products?cat=phones" className="hover:text-brand-500 transition-colors">Smartphones</Link></li>
                          <li><Link href="/products?cat=laptops" className="hover:text-brand-500 transition-colors">Laptops & PCs</Link></li>
                          <li><Link href="/products?cat=audio" className="hover:text-brand-500 transition-colors">Audio & Headphones</Link></li>
                          <li><Link href="/products?cat=wearables" className="hover:text-brand-500 transition-colors">Smart Wearables</Link></li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4">Fashion</h4>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                          <li><Link href="/products?cat=mens" className="hover:text-brand-500 transition-colors">Men's Clothing</Link></li>
                          <li><Link href="/products?cat=womens" className="hover:text-brand-500 transition-colors">Women's Clothing</Link></li>
                          <li><Link href="/products?cat=shoes" className="hover:text-brand-500 transition-colors">Footwear</Link></li>
                          <li><Link href="/products?cat=accessories" className="hover:text-brand-500 transition-colors">Accessories</Link></li>
                        </ul>
                      </div>
                      <div className="bg-slate-50 dark:bg-dark-900 rounded-xl p-4 flex flex-col justify-end relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/20 to-purple-500/20 z-0"></div>
                        <div className="relative z-10">
                          <p className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">New Collection</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white mb-3">Spring 2026 Arrivals</p>
                          <Link href="/products?tag=new" className="text-xs font-bold bg-white dark:bg-dark-800 px-3 py-1.5 rounded-full inline-block shadow-sm group-hover:shadow-md transition-shadow">Shop Now</Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <Link href="/products" className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              {t.explore}
            </Link>
            <Link href="/products?cat=trending" className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1">
              Trending <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>
            </Link>
          </nav>
        </div>

        {/* Center: Global Search */}
        <div className="flex-1 max-w-lg mx-8 hidden lg:block relative z-50">
          <div className={`relative flex items-center w-full transition-all duration-300 ${searchFocused ? 'scale-105' : ''}`}>
            <Search className="absolute left-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              className="w-full h-10 pl-10 pr-4 bg-slate-100 dark:bg-dark-800 border-none outline-none rounded-full text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500/50 transition-shadow"
            />
          </div>
          
          {/* Live Search Suggestions Dropdown */}
          <AnimatePresence>
            {searchFocused && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-12 left-0 w-full bg-white dark:bg-dark-800 rounded-xl shadow-xl border border-slate-200 dark:border-dark-700 overflow-hidden py-2"
              >
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Popular Searches</div>
                <ul>
                  {searchSuggestions.map((product, idx) => (
                    <li key={idx}>
                      <Link 
                        href={`/products/${product.slug || product._id}`}
                        onClick={() => setSearchFocused(false)}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-700 flex items-center gap-2"
                      >
                        <Search className="w-3 h-3 text-slate-400" /> {product.title}
                      </Link>
                    </li>
                  ))}
                  {searchSuggestions.length === 0 && searchQuery.trim() !== '' && (
                     <li className="px-4 py-2 text-sm text-slate-500">No suggestions found</li>
                  )}
                  {searchQuery.trim() === '' && (
                     <li className="px-4 py-2 text-sm text-slate-500">Start typing to search...</li>
                  )}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Settings Group (Theme, Lang, Currency) */}
          <div className="hidden xl:flex items-center gap-2 mr-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
            >
              {mounted ? (theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />) : <div className="w-4 h-4" />}
            </button>
            <div className="h-4 w-px bg-slate-200 dark:bg-dark-700"></div>
            <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="bg-transparent border-none text-xs font-medium text-slate-600 dark:text-slate-300 focus:ring-0 cursor-pointer">
              <option value="en">EN</option>
              <option value="es">ES</option>
              <option value="hi">HI</option>
            </select>
            <div className="h-4 w-px bg-slate-200 dark:bg-dark-700"></div>
            <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="bg-transparent border-none text-xs font-medium text-slate-600 dark:text-slate-300 focus:ring-0 cursor-pointer">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="INR">INR</option>
            </select>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-full transition-colors hidden sm:block">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-dark-900"></span>
          </button>

          {/* Wishlist */}
          <Link href="/wishlist" className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-full transition-colors hidden sm:block">
            <Heart className="w-5 h-5" />
            {mounted && wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-pink-500 border-2 border-white dark:border-[#0f172a] text-[10px] font-bold text-white flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link href="/cart" className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-full transition-colors">
            <ShoppingCart className="w-5 h-5" />
            {mounted && count > 0 && (
              <motion.span 
                key={count}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-brand-500 border-2 border-white dark:border-[#0f172a] text-[10px] font-bold text-white flex items-center justify-center"
              >
                {count}
              </motion.span>
            )}
          </Link>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-full transition-colors flex items-center gap-2"
            >
              {mounted && isLoggedIn ? (
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-brand-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              ) : (
                <User className="w-5 h-5" />
              )}
            </button>
            
            <AnimatePresence>
              {profileOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-56 rounded-2xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-2xl py-2 z-50 origin-top-right overflow-hidden"
                >
                  {isLoggedIn ? (
                    <>
                      <div className="px-4 py-3 bg-slate-50 dark:bg-dark-900/50 mb-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                      </div>
                      <div className="px-2 space-y-1">
                        <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-700 transition-colors">
                          <User className="w-4 h-4 text-slate-400" /> My Account
                        </Link>
                        <Link href="/orders" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-700 transition-colors">
                          <Package className="w-4 h-4 text-slate-400" /> Orders & Returns
                        </Link>
                        <Link href="/wishlist" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-700 transition-colors sm:hidden">
                          <Heart className="w-4 h-4 text-slate-400" /> Wishlist
                        </Link>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-dark-700 px-2">
                        <button onClick={() => { logout(); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 flex flex-col gap-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-white text-center">Welcome to eComm</p>
                      <Link href="/auth/login" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors">
                        Sign In
                      </Link>
                      <Link href="/auth/register" className="w-full flex justify-center py-2 px-4 border border-slate-300 dark:border-dark-600 rounded-xl shadow-sm text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-dark-800 hover:bg-slate-50 dark:hover:bg-dark-700 transition-colors">
                        Create Account
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile menu toggle */}
          <button 
            onClick={() => setMobileOpen(!mobileOpen)} 
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-full transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full h-10 pl-10 pr-4 bg-slate-100 dark:bg-dark-800 border-none outline-none rounded-xl text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-dark-800 pb-4">
                <Link href="/products" className="font-medium text-slate-900 dark:text-white">Shop All</Link>
                <Link href="/products?cat=trending" className="font-medium text-brand-600 dark:text-brand-400">Trending Now</Link>
                <Link href="/products?cat=electronics" className="text-slate-600 dark:text-slate-400">Electronics</Link>
                <Link href="/products?cat=fashion" className="text-slate-600 dark:text-slate-400">Fashion</Link>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-4">
                  <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="bg-slate-100 dark:bg-dark-800 border-none text-sm font-medium text-slate-900 dark:text-white rounded-lg px-2 py-1">
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="hi">हिंदी</option>
                  </select>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="bg-slate-100 dark:bg-dark-800 border-none text-sm font-medium text-slate-900 dark:text-white rounded-lg px-2 py-1">
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-full bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300"
                >
                  {mounted ? (theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />) : <div className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
