"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { getValidImageUrl } from '@/lib/imageFallback';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import { useAppStore } from '../store';
import { SlidersHorizontal, ChevronDown, Check, X, Search, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['All', 'Trending', 'Smartphones', 'Laptops', 'Headphones', 'Smart Watches', 'Gaming Accessories', 'Cameras', 'Home & Kitchen', 'Furniture', 'Fashion'];
const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating_desc', label: 'Highest Rated' },
  { value: 'name_asc', label: 'Name: A to Z' },
];

export default function ProductsPage() {
  const { language } = useAppStore();
  
  const searchParams = useSearchParams();
  const catParam = searchParams.get('cat');
  
  // Filtering States
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [activeCategory, setActiveCategory] = useState(() => {
    if (catParam) {
      if (catParam.toLowerCase() === 'trending') return 'Trending';
      const matched = CATEGORIES.find(c => c.toLowerCase() === catParam.toLowerCase());
      return matched || (catParam.charAt(0).toUpperCase() + catParam.slice(1));
    }
    return 'All';
  });

  useEffect(() => {
    if (catParam) {
      if (catParam.toLowerCase() === 'trending') {
        setActiveCategory('Trending');
      } else {
        const matched = CATEGORIES.find(c => c.toLowerCase() === catParam.toLowerCase());
        setActiveCategory(matched || (catParam.charAt(0).toUpperCase() + catParam.slice(1)));
      }
    }
  }, [catParam]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('featured');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch products (Resetting list when filters change)
  useEffect(() => {
    setPage(1);
    fetchProducts(1, true);
  }, [activeCategory, priceRange, sortBy, debouncedSearch, minRating]);

  // Fetch more products (Pagination)
  useEffect(() => {
    if (page > 1) {
      fetchProducts(page, false);
    }
  }, [page]);

  const fetchProducts = async (currentPage: number, resetList: boolean) => {
    if (resetList) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sort: sortBy
      });

      if (activeCategory !== 'All') params.append('category', activeCategory);
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (priceRange[0] > 0) params.append('min_price', priceRange[0].toString());
      if (priceRange[1] < 3000) params.append('max_price', priceRange[1].toString());
      if (minRating > 0) params.append('min_rating', minRating.toString());

      const res = await api.get(`/api/products?${params.toString()}`);
      if (res.data.success) {
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
           rating: p.average_rating || 4.5,
           reviews: p.review_count || 0,
           badge: p.status === 'NEW' ? 'New Arrival' : undefined
         }));
         
         if (resetList) {
           setProducts(mapped);
         } else {
           setProducts(prev => [...prev, ...mapped]);
         }
         setTotalPages(res.data.totalPages);
         setTotalCount(res.data.total);
      }
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleClearFilters = () => {
    setActiveCategory('All');
    setPriceRange([0, 3000]);
    setSortBy('featured');
    setMinRating(0);
    setSearch('');
  };

  const activeFiltersCount = (activeCategory !== 'All' ? 1 : 0) + 
                             (priceRange[0] > 0 || priceRange[1] < 3000 ? 1 : 0) + 
                             (minRating > 0 ? 1 : 0) + 
                             (debouncedSearch ? 1 : 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] pt-24 pb-20">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-dark-800 border-b border-slate-200 dark:border-dark-700 py-12 mb-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">Shop All Products</h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-lg">
            Discover our premium selection of electronics, wearables, and workspace gear designed to elevate your everyday life.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Toolbar & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-dark-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-dark-700 mb-8 gap-4 relative z-20">
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-dark-900 rounded-xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-dark-700 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" /> 
              Filters {activeFiltersCount > 0 && <span className="bg-brand-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">{activeFiltersCount}</span>}
            </button>
            
            <div className="relative flex-1 md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between w-full md:w-auto gap-6">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 hidden sm:block">
              Showing <span className="font-bold text-slate-900 dark:text-white">{products.length}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalCount}</span> results
            </p>

            <div className="relative w-full sm:w-auto">
              <button 
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="w-full sm:w-auto flex items-center justify-between gap-4 px-4 py-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
              >
                Sort by: <span className="text-brand-600 dark:text-brand-400">{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {sortDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-xl rounded-xl overflow-hidden z-50"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setSortDropdownOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-700 flex items-center justify-between transition-colors"
                      >
                        {opt.label}
                        {sortBy === opt.value && <Check className="w-4 h-4 text-brand-500" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sidebar Filters */}
          <aside className={`lg:w-1/4 shrink-0 transition-all duration-300 ${isSidebarOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl p-6 shadow-sm sticky top-24">
              
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Filters</h3>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-slate-100 dark:bg-dark-900 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white"><X className="w-4 h-4" /></button>
              </div>

              {/* Categories */}
              <div className="mb-8">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-4">Categories</h4>
                <div className="space-y-1">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between group ${
                        activeCategory === cat 
                          ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-900'
                      }`}
                    >
                      {cat}
                      {activeCategory === cat && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-8">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-4">Price Range</h4>
                <div className="flex items-center gap-3">
                  <div className="relative w-1/2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input 
                      type="number" 
                      min="0"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                      className="w-full pl-7 pr-3 py-2 bg-slate-100 dark:bg-dark-900 border border-transparent rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                  <span className="text-slate-400 font-bold">-</span>
                  <div className="relative w-1/2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input 
                      type="number" 
                      min="0"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                      className="w-full pl-7 pr-3 py-2 bg-slate-100 dark:bg-dark-900 border border-transparent rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-8">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-4">Minimum Rating</h4>
                <div className="space-y-2">
                  {[4, 3, 2, 1].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(rating === minRating ? 0 : rating)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 group ${
                        minRating === rating 
                          ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-900'
                      }`}
                    >
                      <div className="flex">
                        {Array.from({length: 5}).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-dark-600'}`} />
                        ))}
                      </div>
                      <span className="text-xs">& Up</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <button 
                  onClick={handleClearFilters}
                  className="w-full py-3 rounded-xl bg-slate-100 dark:bg-dark-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-dark-700 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" /> Clear All Filters
                </button>
              )}

            </div>
          </aside>

          {/* Product Grid */}
          <main className="w-full lg:w-3/4">
            
            {/* Active Filter Chips */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {activeCategory !== 'All' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                    Category: {activeCategory}
                    <button onClick={() => setActiveCategory('All')} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {(priceRange[0] > 0 || priceRange[1] < 3000) && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                    Under ${priceRange[1]}
                    <button onClick={() => setPriceRange([0, 3000])} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {minRating > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {minRating}+ Stars
                    <button onClick={() => setMinRating(0)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {debouncedSearch && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                    Search: "{debouncedSearch}"
                    <button onClick={() => setSearch('')} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({length: 6}).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {products.map((product) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        key={product.id}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                
                {/* Pagination Load More */}
                {page < totalPages && (
                  <div className="mt-12 flex justify-center">
                    <button 
                      onClick={() => setPage(p => p + 1)}
                      disabled={loadingMore}
                      className="px-8 py-3 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-900 hover:shadow-md transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> 
                          Loading...
                        </>
                      ) : 'Load More Products'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-dark-800 rounded-2xl border border-slate-200 dark:border-dark-700 p-16 text-center shadow-sm">
                <div className="w-20 h-20 bg-slate-100 dark:bg-dark-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <SlidersHorizontal className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No products found</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                  We couldn't find any products matching your current filters. Try adjusting your category or price range.
                </p>
                <button 
                  onClick={handleClearFilters}
                  className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
}
