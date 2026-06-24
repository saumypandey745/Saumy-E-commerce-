'use client';

import { useAppStore } from '../../store';
import { Heart, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import ProductCard from '../../../components/ProductCard';
import { api } from '@/lib/api';

export default function WishlistPage() {
  const { wishlist } = useAppStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch only the wishlist items by ID. 
    // Here we fetch all and filter.
    api.get('/api/products')
      .then((res) => {
        if (res.data.products) {
          setProducts(res.data.products.filter((p: any) => wishlist.includes(p.id)));
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [wishlist]);

  return (
    <div className="container mx-auto px-6 py-12 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="w-8 h-8 text-pink-400" />
        <h1 className="text-4xl font-bold text-white">My Wishlist</h1>
      </div>
      
      {loading ? (
        <p className="text-gray-400">Loading your favorites...</p>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 glass rounded-3xl text-center">
          <Heart className="w-16 h-16 text-gray-500 mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Your wishlist is empty</h2>
          <p className="text-gray-400 mb-8">Save items you love by clicking the heart icon on any product.</p>
          <Link href="/products" className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-8 py-3 font-semibold text-white transition-all hover:scale-105">
            Discover Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
              <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
