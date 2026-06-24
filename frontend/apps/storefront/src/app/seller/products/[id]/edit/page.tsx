// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/SellerDashboardLayout';
import { api } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { 
  Save, 
  ArrowLeft,
  Loader2,
  UploadCloud,
  X
} from 'lucide-react';
import Link from 'next/link';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    description: '',
    base_price: '',
    discount_percentage: '0',
    stock: '10',
    sku: '',
    category_id: '',
    images: '',
    existingImages: [] as string[]
  });
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      try {
        setFetching(true);
        const res = await api.get(`/api/products/${productId}`);
        if (res.data.success) {
          const p = res.data.product;
          setFormData({
            title: p.title || '',
            short_description: p.short_description || '',
            description: p.description || '',
            base_price: p.base_price?.toString() || '',
            discount_percentage: p.discount_percentage?.toString() || '0',
            stock: p.variants?.[0]?.inventory_count?.toString() || '10',
            sku: p.variants?.[0]?.sku || '',
            category_id: p.category_id || '',
            images: '', // We don't populate the comma string with existing images to avoid duplication
            existingImages: p.images || []
          });
        }
      } catch (err: any) {
        setError('Failed to load product details');
        console.error(err);
      } finally {
        setFetching(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Update Product
      const newImages = formData.images ? formData.images.split(',').map(u => u.trim()).filter(Boolean) : [];
      
      const payload: any = {
        title: formData.title,
        short_description: formData.short_description,
        description: formData.description,
        base_price: parseFloat(formData.base_price),
        discount_percentage: parseFloat(formData.discount_percentage),
        images: [...formData.existingImages, ...newImages], // Keep old images and add new text URL images
        variants: [{
          sku: formData.sku || `SKU-${Date.now()}`,
          inventory_count: parseInt(formData.stock)
        }]
      };

      if (formData.category_id) {
        payload.category_id = formData.category_id;
      } else {
        // Fallback for older products with null category
        payload.category_id = '60d21b4667d0d8992e610c85';
      }

      const res = await api.put(`/api/sellers/products/${productId}`, payload);
      
      if (res.data.success) {
        // 2. Upload new images if any
        if (selectedFiles.length > 0) {
          for (const file of selectedFiles) {
            const formDataUpload = new FormData();
            formDataUpload.append('image', file);
            await api.post(`/api/sellers/products/${productId}/upload-image`, formDataUpload);
          }
        }
        
        router.push('/seller/products');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const removeExistingImage = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      existingImages: prev.existingImages.filter((_, i) => i !== idx)
    }));
  };

  if (fetching) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center p-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <Link href="/seller/products" className="p-2 -ml-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Product</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Update your product listing</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/seller/products" className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Cancel
          </Link>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white rounded-xl font-medium transition-colors gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Changes
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/30 p-4 rounded-xl text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Product Title</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow dark:text-white"
                  placeholder="e.g. Wireless Noise Cancelling Headphones"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Short Description</label>
                <input
                  type="text"
                  value={formData.short_description}
                  onChange={e => setFormData({...formData, short_description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow dark:text-white"
                  placeholder="Brief summary of the product"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Detailed Description</label>
                <textarea
                  required
                  rows={6}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow dark:text-white"
                  placeholder="Full description including features, materials, etc."
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Pricing</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Base Price ($)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_price}
                  onChange={e => setFormData({...formData, base_price: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow dark:text-white"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Discount Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount_percentage}
                  onChange={e => setFormData({...formData, discount_percentage: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Inventory & Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SKU (Stock Keeping Unit)</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={e => setFormData({...formData, sku: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow dark:text-white"
                  placeholder="Leave empty to auto-generate"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock Quantity</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={e => setFormData({...formData, stock: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Product Images</h2>
            <div className="space-y-4">
              {/* Existing Images */}
              {formData.existingImages.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Existing Images</label>
                  <div className="grid grid-cols-2 gap-3">
                    {formData.existingImages.map((img, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 flex items-center gap-2">
                        <img 
                          src={img} 
                          alt="preview" 
                          className="w-10 h-10 object-cover rounded-md"
                        />
                        <span className="text-xs truncate font-medium text-slate-700 dark:text-slate-300 flex-1">
                          Image {idx + 1}
                        </span>
                        <button 
                          type="button"
                          onClick={() => removeExistingImage(idx)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-md transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Add Image URLs (Optional)</label>
                <textarea
                  rows={2}
                  value={formData.images}
                  onChange={e => setFormData({...formData, images: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow dark:text-white text-sm"
                  placeholder="https://example.com/image1.jpg (Separate with commas)"
                />
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">OR</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Upload New Files</label>
                <label className="flex flex-col items-center px-4 py-8 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors">
                  <UploadCloud className="w-10 h-10 mb-2 text-indigo-500" />
                  <p className="text-sm font-medium text-center">Click to browse or drag and drop</p>
                  <p className="text-xs mt-1">PNG, JPG up to 5MB</p>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files) {
                        setSelectedFiles(Array.from(e.target.files));
                      }
                    }}
                  />
                </label>
                
                {selectedFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 flex items-center gap-2">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt="preview" 
                          className="w-10 h-10 object-cover rounded-md"
                        />
                        <span className="text-xs truncate font-medium text-slate-700 dark:text-slate-300 flex-1">
                          {file.name}
                        </span>
                        <button 
                          type="button"
                          onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== idx))}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-md transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
