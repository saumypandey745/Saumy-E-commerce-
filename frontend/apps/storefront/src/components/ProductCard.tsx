"use client";

import { ShoppingCart, Heart } from 'lucide-react'
import { useAppStore } from '../app/store'
import { getValidImageUrl } from '../lib/imageFallback';
import { translations, Language, conversionRates, currencySymbols, Currency } from '../app/translations'
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Product {
  id: string
  title: string
  price: number
  base_price?: number
  image: string
  category: string
  badge?: string
}

export default function ProductCard({ product }: { product: Product }) {
  const language = useAppStore((state) => state.language);
  const t = translations[language as Language];
  const { currency, addToCart, wishlist, toggleWishlist } = useAppStore();
  
  const rate = conversionRates[currency as Currency] || 1;
  const symbol = currencySymbols[currency as Currency] || '$';
  const baseVal = product.base_price !== undefined ? product.base_price : product.price;
  const displayPrice = (baseVal * rate).toFixed(2);

  const isLiked = wishlist.includes(product.id);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.2)] dark:hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)]">
      
      {/* Badge */}
      {product.badge && (
        <div className="absolute top-4 left-4 z-20">
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-brand-500 to-purple-500 text-[10px] font-bold text-white shadow-lg uppercase tracking-wider">
            {product.badge}
          </span>
        </div>
      )}

      {/* Wishlist Button */}
      <motion.button 
        whileTap={{ scale: 0.8 }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product.id); }}
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/50 dark:bg-dark-900/50 backdrop-blur-md border border-slate-200 dark:border-white/10 opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-white dark:hover:bg-dark-900"
      >
        <Heart className={`w-4 h-4 ${isLiked ? 'fill-pink-500 text-pink-500' : 'text-slate-600 dark:text-slate-300'}`} />
      </motion.button>

      {/* Image Container */}
      <Link href={`/products/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-slate-100 dark:bg-dark-900">
        <img 
          src={getValidImageUrl(product.image, product.category || product.title)} 
          onError={(e) => { e.currentTarget.src = `https://placehold.co/800x800/png?text=${encodeURIComponent(product.category || product.title || 'Product')}`; }}
          alt={product.title} 
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Quick Add Overlay */}
        <div className="absolute bottom-4 left-0 w-full px-4 z-20 transform translate-y-12 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
           <motion.button 
             whileTap={{ scale: 0.95 }}
             onClick={(e) => {
               e.preventDefault();
               e.stopPropagation();
               addToCart({
                 id: product.id,
                 title: product.title,
                 price: baseVal,
                 image: product.image,
                 category: product.category
               });
             }}
             className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/90 dark:bg-dark-900/90 backdrop-blur-md border border-slate-200 dark:border-dark-700 text-brand-600 dark:text-brand-400 font-bold hover:bg-brand-600 hover:text-white dark:hover:bg-brand-500 dark:hover:text-white transition-colors shadow-lg"
           >
              <ShoppingCart className="w-4 h-4" />
              {t.addToCart}
           </motion.button>
        </div>
      </Link>

      {/* Content */}
      <Link href={`/products/${product.id}`} className="relative z-20 flex flex-col p-5 flex-1">
        <p className="text-[11px] font-bold tracking-widest text-brand-500 uppercase mb-2">{product.category}</p>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-4 line-clamp-2">{product.title}</h3>
        
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 dark:border-dark-700">
          <p className="text-lg font-black text-slate-900 dark:text-white">{symbol}{displayPrice}</p>
          <div className="flex items-center gap-1">
            <span className="text-yellow-400 text-sm">★</span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">4.8</span>
          </div>
        </div>
      </Link>
    </div>
  )
}
