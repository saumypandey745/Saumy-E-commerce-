// @ts-nocheck
"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/SellerDashboardLayout';
import { api } from '@/lib/api';
import { useAppStore } from '@/app/store';
import Link from 'next/link';
import { 
  Package, 
  Plus, 
  Search, 
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  Loader2
} from 'lucide-react';

export default function ProductsPage() {
  const { user } = useAppStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user?.id) return;
      try {
        const res = await api.get(`/api/products?seller_id=${user.id}`);
        if (res.data.success && res.data.products) {
          setProducts(res.data.products);
        }
      } catch (err) {
        console.error('Failed to fetch products', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to archive this product?')) return;
    try {
      const res = await api.delete(`/api/sellers/products/${id}`);
      if (res.data.success) {
        setProducts(products.map(p => p._id === id ? { ...p, status: 'ARCHIVED' } : p));
      }
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Products</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your store inventory</p>
        </div>
        <Link 
          href="/seller/products/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow dark:text-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4">Product Details</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white line-clamp-1">{product.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">SKU: {product.variants?.[0]?.sku || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900 dark:text-white">${product.final_price}</p>
                      {product.discount_percentage > 0 && (
                        <p className="text-xs text-slate-500 line-through">${product.base_price}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400' :
                        product.status === 'DRAFT' ? 'bg-slate-100 text-slate-800 dark:bg-slate-500/10 dark:text-slate-400' :
                        product.status === 'ARCHIVED' ? 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/products/${product._id}`} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={`/seller/products/${product._id}/edit`} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(product._id)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors" 
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No products found</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">You haven't added any products to your store yet.</p>
            <Link 
              href="/seller/products/new"
              className="inline-flex items-center justify-center px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl font-medium transition-colors"
            >
              Add Your First Product
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
