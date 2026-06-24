"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { api } from '@/lib/api';
import { Filter, ChevronRight, Search as SearchIcon } from 'lucide-react';

import { Suspense } from 'react';

function SearchResults() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<any[]>([]);
  const [facets, setFacets] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        let url = `/api/search?q=${encodeURIComponent(query)}&limit=20`;
        if (selectedCategory) url += `&category=${encodeURIComponent(selectedCategory)}`;
        if (selectedBrand) url += `&brand=${encodeURIComponent(selectedBrand)}`;
        
        const res = await api.get(url);
        if (res.data.success) {
          const payload = res.data.data || res.data;
          setProducts(payload.products || []);
          setFacets(payload.facets || {});
          setTotal(payload.total || 0);
        }
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [query, selectedCategory, selectedBrand]);

  const categories = facets?.categories?.buckets || [];
  const brands = facets?.brands?.buckets || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-2 mb-8">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Search Results</h1>
          {query && <span className="text-slate-500 dark:text-slate-400 text-xl font-medium">for "{query}"</span>}
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Panel: Filters */}
          <div className="w-full lg:w-64 shrink-0">
            <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-slate-200 dark:border-dark-700 sticky top-24">
              <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white font-bold pb-4 border-b border-slate-200 dark:border-dark-700">
                <Filter className="w-5 h-5" />
                Filters
              </div>
              
              <div className="mb-8">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Categories</h3>
                <div className="space-y-2">
                  <div 
                    className={`cursor-pointer text-sm font-medium flex justify-between ${selectedCategory === '' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-700 dark:text-slate-300'}`}
                    onClick={() => setSelectedCategory('')}
                  >
                    All Categories
                  </div>
                  {categories.map((cat: any) => (
                    <div 
                      key={cat.key}
                      className={`cursor-pointer text-sm font-medium flex justify-between ${selectedCategory === cat.key ? 'text-brand-600 dark:text-brand-400' : 'text-slate-700 dark:text-slate-300 hover:text-brand-500'}`}
                      onClick={() => setSelectedCategory(cat.key)}
                    >
                      <span>{cat.key}</span>
                      <span className="text-slate-400 bg-slate-100 dark:bg-dark-900 px-2 rounded-md text-xs">{cat.doc_count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Brands</h3>
                <div className="space-y-2">
                  <div 
                    className={`cursor-pointer text-sm font-medium flex justify-between ${selectedBrand === '' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-700 dark:text-slate-300'}`}
                    onClick={() => setSelectedBrand('')}
                  >
                    All Brands
                  </div>
                  {brands.map((brand: any) => (
                    <div 
                      key={brand.key}
                      className={`cursor-pointer text-sm font-medium flex justify-between ${selectedBrand === brand.key ? 'text-brand-600 dark:text-brand-400' : 'text-slate-700 dark:text-slate-300 hover:text-brand-500'}`}
                      onClick={() => setSelectedBrand(brand.key)}
                    >
                      <span>{brand.key}</span>
                      <span className="text-slate-400 bg-slate-100 dark:bg-dark-900 px-2 rounded-md text-xs">{brand.doc_count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
            </div>
          </div>
          
          {/* Right Panel: Results */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <div className="text-slate-600 dark:text-slate-400 font-medium">
                {loading ? 'Searching...' : `Found ${total} products`}
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((p: any) => {
                  const productForCard = {
                    id: p.slug || p._id || p.sku,
                    title: p.title,
                    price: p.base_price,
                    image: p.images && p.images.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
                    category: p.category,
                    rating: p.average_rating || 4.5,
                    reviews: p.review_count || 0
                  };
                  return <ProductCard key={productForCard.id} product={productForCard} />;
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700 p-16 text-center shadow-sm">
                <SearchIcon className="w-16 h-16 text-slate-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No results found</h3>
                <p className="text-slate-500 dark:text-slate-400">We couldn't find anything matching your search criteria. Try adjusting your filters or search query.</p>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-32 text-center text-slate-500">Loading...</div>}>
      <SearchResults />
    </Suspense>
  );
}
