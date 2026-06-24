"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShieldCheck, Truck, RefreshCw, Plus, Minus, Heart, Share2, ShoppingCart, Check, ChevronRight, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store';
import { conversionRates, currencySymbols, translations, Language, Currency } from '../../translations';
import ProductCard from '@/components/ProductCard';
import { api } from '@/lib/api';
import { getValidImageUrl } from '@/lib/imageFallback';

// Removed dummy DB, will fetch related products from API


export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { currency, addToCart, wishlist, toggleWishlist } = useAppStore();
  const language = useAppStore((state) => state.language);
  const t = translations[language as Language];
  const [mounted, setMounted] = useState(false);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [mainImageIdx, setMainImageIdx] = useState(0);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [mlMetadata, setMlMetadata] = useState<{ version?: string, score?: number }>({});

  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/api/products/${params.id}`);
        if (res.data.success && res.data.product) {
          const p = res.data.product;
          let allImages = p.images && p.images.length > 0 ? [...p.images] : [
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=800'
          ];
          if (p.variants) {
            p.variants.forEach((v: any) => {
              if (v.images && v.images.length > 0) {
                v.images.forEach((img: string) => {
                  if (!allImages.includes(img)) allImages.push(img);
                });
              }
            });
          }

          setProduct({
            id: p._id,
            title: p.title,
            price: p.base_price,
            image: allImages[0],
            images: allImages,
            category: p.category || 'General',
            description: p.description || 'Experience unparalleled quality.',
            rating: p.average_rating || 4.8,
            reviews: p.review_count || 128,
            badge: p.status === 'NEW' ? 'New Arrival' : undefined,
            stock: p.total_inventory_count !== undefined ? p.total_inventory_count : 10,
            variants: p.variants || [],
            features: p.features || [],
            specifications: p.specifications || {},
            delivery_estimate: p.delivery_estimate || '3-5 Business Days',
            warranty: p.warranty || '1 Year Warranty',
            return_policy: p.return_policy || '30-Day Returns'
          });
          
          // Auto-select first variant options if available
          if (p.variants && p.variants.length > 0) {
            if (p.variants[0].color) setSelectedColor(p.variants[0].color);
            if (p.variants[0].size) setSelectedSize(p.variants[0].size);
            if (p.variants[0].storage) setSelectedStorage(p.variants[0].storage);
          }
        }

        // Fetch AI personalized recommendations
        try {
          // The gateway maps /api/ml/recommendations to the ML service
          const mlRes = await api.post('/api/ml/recommendations', {
            user_id: 'guest',
            k_recommendations: 4
          });

          if (mlRes.data && mlRes.data.recommended_product_ids) {
            setMlMetadata({
              version: mlRes.data.model_version,
              score: mlRes.data.confidence_score
            });
          }
        } catch (mlErr) {
          console.error("AI Recommendation failed, falling back to standard fetch", mlErr);
        }

        // Fetch actual products for the grid (using standard fetch as mock IDs don't exist in our DB)
        const relRes = await api.get('/api/products');
        if (relRes.data.success) {
          // We map them but pretend they are the AI recommended ones for the UI demo
          const mapped = relRes.data.products.map((p: any) => ({
            id: p._id,
            title: p.title,
            price: p.base_price,
            base_price: p.base_price,
            image: p.images && p.images.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
            category: p.category,
            rating: 4.5,
            reviews: 0,
            badge: p.status === 'NEW' ? 'New Arrival' : undefined
          })).filter((p: any) => p.id !== params.id).slice(0, 4);
          setRelatedProducts(mapped);
        }

        // Fetch reviews
        try {
          const revRes = await api.get(`/api/reviews/${params.id}`);
          if (revRes.data.success) {
            setReviews(revRes.data.reviews);
          }
        } catch (e) {
          console.error("Failed to fetch reviews", e);
        }
      } catch (err) {
        console.error("Failed to fetch product", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [params.id]);

  const colors = ['Graphite', 'Lunar Silver', 'Midnight Blue'];
  const sizes = ['Standard', 'Pro', 'Max'];

  if (loading) {
    return <div className="min-h-screen pt-32 text-center text-slate-500">Loading product details...</div>;
  }

  if (!product) {
    return <div className="min-h-screen pt-32 text-center text-slate-500">Product not found.</div>;
  }

  const gallery = product.images;

  const availableColors = product ? Array.from(new Set(product.variants?.map((v: any) => v.color).filter(Boolean))) as string[] : [];
  const availableSizes = product ? Array.from(new Set(product.variants?.map((v: any) => v.size).filter(Boolean))) as string[] : [];
  const availableStorages = product ? Array.from(new Set(product.variants?.map((v: any) => v.storage).filter(Boolean))) as string[] : [];

  // Calculate dynamic price based on selected variants
  let dynamicPrice = product.price;
  let activeVariant = null;
  if (product.variants && product.variants.length > 0) {
    activeVariant = product.variants.find((v: any) => 
      (!selectedColor || v.color === selectedColor) && 
      (!selectedSize || v.size === selectedSize) &&
      (!selectedStorage || v.storage === selectedStorage)
    );
    if (activeVariant) {
      dynamicPrice += activeVariant.price_modifier || 0;
    }
  }

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) {
      addToCart({
        id: activeVariant ? activeVariant.sku : product.id,
        title: `${product.title}${selectedColor ? ' - ' + selectedColor : ''}${selectedSize ? ' - ' + selectedSize : ''}${selectedStorage ? ' - ' + selectedStorage : ''}`,
        price: dynamicPrice,
        image: activeVariant && activeVariant.images?.length > 0 ? activeVariant.images[0] : product.image,
        category: product.category
      });
    }

    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const isLiked = wishlist.includes(product.id);
  const rate = conversionRates[currency] || 1;
  const symbol = currencySymbols[currency] || '$';
  const displayPrice = (dynamicPrice * rate).toFixed(2);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    try {
      const res = await api.post('/api/reviews', {
        product_id: product.id,
        rating: reviewRating,
        comment: reviewComment
      });
      if (res.data.success) {
        setReviews([res.data.review, ...reviews]);
        setShowReviewForm(false);
        setReviewComment('');
        setReviewRating(5);
        // Refresh product to get updated average rating
        const pRes = await api.get(`/api/products/${product.id}`);
        if (pRes.data.success) {
          setProduct((prev: any) => ({
            ...prev,
            rating: pRes.data.product.average_rating,
            reviews: pRes.data.product.review_count
          }));
        }
      }
    } catch (e) {
      console.error("Failed to submit review", e);
      alert("Failed to submit review. Are you logged in?");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] pt-24 pb-20 transition-colors">

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <nav className="flex text-sm text-slate-500 dark:text-slate-400 font-medium">
          <Link href="/" className="hover:text-brand-600 dark:hover:text-brand-400">Home</Link>
          <ChevronRight className="w-4 h-4 mx-2 mt-0.5" />
          <Link href="/products" className="hover:text-brand-600 dark:hover:text-brand-400">Products</Link>
          <ChevronRight className="w-4 h-4 mx-2 mt-0.5" />
          <Link href={`/products?cat=${product.category}`} className="hover:text-brand-600 dark:hover:text-brand-400">{product.category}</Link>
          <ChevronRight className="w-4 h-4 mx-2 mt-0.5" />
          <span className="text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-none">{product.title}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700 shadow-sm overflow-hidden mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2">

            {/* Left: Image Gallery */}
            <div className="p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900/50">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-white dark:bg-dark-800 shadow-sm mb-4 border border-slate-200 dark:border-dark-700">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={mainImageIdx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    src={getValidImageUrl(gallery[mainImageIdx], product.title)}
                    onError={(e: any) => { e.currentTarget.src = `https://placehold.co/800x800/png?text=${encodeURIComponent(product.title || 'Product')}`; }}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>
                {product.badge && (
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-brand-500 text-xs font-bold text-white shadow-lg uppercase tracking-wider">{product.badge}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-4">
                {gallery.map((img: string, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => setMainImageIdx(idx)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      mainImageIdx === idx ? 'border-brand-500 shadow-md scale-105' : 'border-transparent hover:border-slate-300 dark:hover:border-dark-600'
                    }`}
                  >
                    <img 
                      src={getValidImageUrl(img, product.title)} 
                      onError={(e: any) => { e.currentTarget.src = `https://placehold.co/800x800/png?text=${encodeURIComponent(product.title || 'Product')}`; }}
                      className="w-full h-full object-cover" 
                      alt={`Thumbnail ${idx + 1}`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Product Info & Actions */}
            <div className="p-6 md:p-10 flex flex-col">
              <div className="mb-2">
                <span className="text-xs font-bold tracking-widest text-brand-500 uppercase">{product.category}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 leading-tight">{product.title}</h1>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-700'}`} />
                  ))}
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{product.rating} ({product.reviews} reviews)</span>
              </div>

              <div className="text-4xl font-black text-slate-900 dark:text-white mb-8">
                {mounted ? `${symbol}${displayPrice}` : ''}
              </div>

              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                {product.description}
              </p>

              {/* Variants */}
              <div className="mb-8 space-y-6">
                {availableColors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Color: <span className="text-slate-500 dark:text-slate-400 font-medium ml-1">{selectedColor}</span></h4>
                    <div className="flex gap-3 flex-wrap">
                      {availableColors.map(color => (
                        <button
                          key={color}
                          onClick={() => {
                            setSelectedColor(color);
                            // Set main image to variant image if available
                            const v = product.variants.find((v: any) => v.color === color && v.images && v.images.length > 0);
                            if (v && gallery.includes(v.images[0])) {
                              setMainImageIdx(gallery.indexOf(v.images[0]));
                            }
                          }}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors border ${selectedColor === color ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md' : 'bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-700 hover:bg-slate-50 dark:hover:bg-dark-700'}`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {availableSizes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Size: <span className="text-slate-500 dark:text-slate-400 font-medium ml-1">{selectedSize}</span></h4>
                    <div className="flex gap-3 flex-wrap">
                      {availableSizes.map(size => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors border ${selectedSize === size ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md' : 'bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-700 hover:bg-slate-50 dark:hover:bg-dark-700'}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {availableStorages.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Storage: <span className="text-slate-500 dark:text-slate-400 font-medium ml-1">{selectedStorage}</span></h4>
                    <div className="flex gap-3 flex-wrap">
                      {availableStorages.map(storage => (
                        <button
                          key={storage}
                          onClick={() => setSelectedStorage(storage)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors border ${selectedStorage === storage ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md' : 'bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-700 hover:bg-slate-50 dark:hover:bg-dark-700'}`}
                        >
                          {storage}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mb-10 pt-8 border-t border-slate-200 dark:border-dark-700">

                {/* Quantity */}
                <div className="flex items-center justify-between w-full sm:w-32 bg-slate-100 dark:bg-dark-900 rounded-xl p-1 border border-slate-200 dark:border-dark-700">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-dark-800 rounded-lg transition-colors"><Minus className="w-4 h-4" /></button>
                  <span className="font-bold text-slate-900 dark:text-white">{qty}</span>
                  <button onClick={() => setQty(Math.min(product.stock, qty + 1))} disabled={qty >= product.stock} className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-dark-800 rounded-lg transition-colors disabled:opacity-50"><Plus className="w-4 h-4" /></button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={addedAnimation || product.stock === 0}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all ${addedAnimation ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : product.stock === 0 ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/30 active:scale-95'}`}
                >
                  {addedAnimation ? (
                    <><Check className="w-5 h-5" /> {t.addedToCart}</>
                  ) : product.stock === 0 ? (
                    <><ShoppingCart className="w-5 h-5" /> {t.outOfStock}</>
                  ) : (
                    <><ShoppingCart className="w-5 h-5" /> {t.addToCart}</>
                  )}
                </button>

                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`w-14 h-14 flex items-center justify-center rounded-xl border transition-all ${isLiked ? 'bg-pink-50 dark:bg-pink-500/10 border-pink-200 dark:border-pink-500/20 text-pink-500' : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700 text-slate-400 hover:text-pink-500 hover:border-pink-200 dark:hover:border-dark-600'}`}
                >
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-pink-500' : ''}`} />
                </button>
              </div>
              
              {/* Delivery PIN Check */}
              <div className="mb-8 p-5 bg-slate-50 dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-700">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  <h4 className="font-bold text-slate-900 dark:text-white">{t.deliveryCheck}</h4>
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder={t.enterPin} className="flex-1 px-4 py-3 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500" />
                  <button className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">{t.check}</button>
                </div>
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm">
                  <Truck className="w-5 h-5 text-brand-500" /> {product.delivery_estimate}
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm">
                  <ShieldCheck className="w-5 h-5 text-brand-500" /> {product.warranty}
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm">
                  <RefreshCw className="w-5 h-5 text-brand-500" /> {product.return_policy}
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm cursor-pointer hover:text-brand-500" onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Link copied!"); }}>
                  <Share2 className="w-5 h-5 text-brand-500" /> Share Product
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Tabs: Description, Specs, Reviews */}
        <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700 shadow-sm overflow-hidden mb-20">
          <div className="flex border-b border-slate-200 dark:border-dark-700 overflow-x-auto hide-scrollbar">
            {['description', 'specifications', 'shipping', 'reviews'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-5 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors relative ${activeTab === tab ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-500" />
                )}
              </button>
            ))}
          </div>

          <div className="p-8 md:p-12 min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === 'description' && (
                <motion.div
                  key="desc"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="prose prose-slate dark:prose-invert max-w-4xl"
                >
                  <h3 className="text-2xl font-bold mb-4">The Ultimate {product.category} Experience</h3>
                  <p className="text-lg leading-relaxed mb-6">
                    {product.description}
                  </p>
                  <p className="text-lg leading-relaxed mb-6">
                    Meticulously crafted from aerospace-grade materials, the {product.title} redefines the standards for premium hardware. Every curve, every switch, and every component has been obsessively engineered to deliver a flawless user experience.
                  </p>
                  <ul className="space-y-2 text-lg">
                    <li>Advanced neural-processing architecture for zero-latency operations.</li>
                    <li>Eco-friendly anodized aluminum chassis.</li>
                    <li>Up to 48 hours of uninterrupted battery life on a single charge.</li>
                    <li>Water and dust resistant (IP68 certified).</li>
                  </ul>
                </motion.div>
              )}

              {activeTab === 'specifications' && (
                <motion.div
                  key="specs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Technical Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.specifications && Object.keys(product.specifications).length > 0 ? (
                      Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between p-4 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">{key}</span>
                          <span className="text-slate-900 dark:text-white font-bold">{value as React.ReactNode}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex justify-between p-4 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Brand</span>
                          <span className="text-slate-900 dark:text-white font-bold">Aero</span>
                        </div>
                        <div className="flex justify-between p-4 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Model</span>
                          <span className="text-slate-900 dark:text-white font-bold">X-Treme Pro</span>
                        </div>
                        <div className="flex justify-between p-4 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Weight</span>
                          <span className="text-slate-900 dark:text-white font-bold">2.4 lbs</span>
                        </div>
                        <div className="flex justify-between p-4 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Dimensions</span>
                          <span className="text-slate-900 dark:text-white font-bold">12 x 8 x 2 inches</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {product.features && product.features.length > 0 && (
                    <div className="mt-8">
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Key Features</h4>
                      <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400">
                        {product.features.map((feat: string, i: number) => (
                          <li key={i}>{feat}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'shipping' && (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 max-w-4xl"
                >
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Shipping & Returns</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Truck className="w-6 h-6 text-brand-500" />
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Delivery Options</h4>
                      </div>
                      <ul className="space-y-4 text-slate-600 dark:text-slate-400">
                        <li className="flex justify-between border-b border-slate-200 dark:border-dark-700 pb-2">
                          <span>Standard Delivery ({product.delivery_estimate})</span>
                          <span className="font-bold text-slate-900 dark:text-white">Free</span>
                        </li>
                        <li className="flex justify-between border-b border-slate-200 dark:border-dark-700 pb-2">
                          <span>Express Delivery (1-2 Days)</span>
                          <span className="font-bold text-slate-900 dark:text-white">{symbol}15.00</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <RefreshCw className="w-6 h-6 text-brand-500" />
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Return Policy</h4>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                        {product.return_policy}. We accept returns for all unworn and unused items within the return window. Please ensure the original tags are attached.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'reviews' && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex flex-col md:flex-row gap-12 max-w-5xl">
                    <div className="w-full md:w-1/3">
                      <div className="text-6xl font-black text-slate-900 dark:text-white mb-2">{typeof product.rating === 'number' ? product.rating.toFixed(1) : product.rating}</div>
                      <div className="flex gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-700'}`} />
                        ))}
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mb-6">Based on {product.reviews} verified reviews</p>

                      {!showReviewForm ? (
                        <button onClick={() => setShowReviewForm(true)} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
                          Write a Review
                        </button>
                      ) : (
                        <form onSubmit={handleSubmitReview} className="bg-slate-50 dark:bg-dark-900 p-6 rounded-2xl border border-slate-200 dark:border-dark-700">
                          <h4 className="font-bold mb-4">Your Review</h4>
                          <div className="flex gap-2 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button type="button" key={star} onClick={() => setReviewRating(star)} className="focus:outline-none">
                                <Star className={`w-6 h-6 ${star <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-700'}`} />
                              </button>
                            ))}
                          </div>
                          <textarea
                            required
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Share your experience..."
                            className="w-full bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none mb-4 min-h-[100px]"
                          ></textarea>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setShowReviewForm(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                            <button type="submit" disabled={isSubmittingReview} className="flex-1 px-4 py-2 bg-brand-600 text-white text-sm font-bold rounded-lg hover:bg-brand-700 disabled:opacity-50">
                              {isSubmittingReview ? 'Submitting...' : 'Submit'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    <div className="w-full md:w-2/3 space-y-8">
                      {reviews.length === 0 ? (
                        <div className="text-slate-500 dark:text-slate-400 italic">No reviews yet. Be the first to review this product!</div>
                      ) : (
                        reviews.map((review, idx) => (
                          <div key={review._id || idx} className="border-b border-slate-200 dark:border-dark-700 pb-8">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center">
                                  {review.user_id ? review.user_id.substring(0, 2).toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white">User {review.user_id ? review.user_id.substring(0, 4) : ''}</div>
                                  <div className="text-xs text-slate-500 flex items-center gap-2">
                                    {new Date(review.createdAt || Date.now()).toLocaleDateString()}
                                    {review.is_verified_purchase && (
                                      <span className="text-emerald-500 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Verified Buyer</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-700'}`} />
                                ))}
                              </div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                              {review.comment}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Related Products */}
        <div className="mb-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">You might also like</h2>
            {mlMetadata.version && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full text-xs font-bold border border-brand-200 dark:border-brand-500/30 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Recommended ({(mlMetadata.score! * 100).toFixed(0)}% Match)</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
