import { create } from 'zustand';
import { Language, Currency } from './translations';
import { api } from '@/lib/api';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  token?: string;
  role?: string;
}

interface AppState {
  // i18n
  language: Language;
  currency: Currency;
  setLanguage: (lang: Language) => void;
  setCurrency: (curr: Currency) => void;

  // Cart
  // Cart
  cart: CartItem[];
  fetchCart: () => Promise<void>;
  addToCart: (item: Omit<CartItem, 'quantity'>) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartTotal: () => number;
  cartCount: () => number;

  // Auth
  user: UserInfo | null;
  isLoggedIn: boolean;
  login: (user: UserInfo) => void;
  logout: () => void;
  updateUser: (updates: Partial<UserInfo>) => void;

  // Wishlist
  wishlist: string[];
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (id: string) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Seller Hub
  storeProfile: any | null;
  setStoreProfile: (profile: any) => void;
}

// Load cart from localStorage
const loadCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('ecomm_cart');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const loadWishlist = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('ecomm_wishlist');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const loadUser = (): { user: UserInfo | null; isLoggedIn: boolean } => {
  if (typeof window === 'undefined') return { user: null, isLoggedIn: false };
  try {
    const saved = localStorage.getItem('ecomm_user');
    if (saved) {
      const user = JSON.parse(saved);
      return { user, isLoggedIn: true };
    }
  } catch {}
  return { user: null, isLoggedIn: false };
};

const loadLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem('ecomm_lang');
    return (saved as Language) || 'en';
  } catch { return 'en'; }
};

const loadCurrency = (): Currency => {
  if (typeof window === 'undefined') return 'USD';
  try {
    const saved = localStorage.getItem('ecomm_currency');
    return (saved as Currency) || 'USD';
  } catch { return 'USD'; }
};

export const useAppStore = create<AppState>((set, get) => ({
  language: loadLanguage(),
  currency: loadCurrency(),
  setLanguage: (language) => {
    if (typeof window !== 'undefined') localStorage.setItem('ecomm_lang', language);
    set({ language });
  },
  setCurrency: (currency) => {
    if (typeof window !== 'undefined') localStorage.setItem('ecomm_currency', currency);
    set({ currency });
  },

  // Cart
  // Cart
  cart: loadCart(),
  fetchCart: async () => {
    try {
      const res = await api.get('/api/v1/cart');
      if (res.data.success && res.data.data) {
        const cartItems = res.data.data.items.map((item: any) => ({
          id: item.productId,
          title: item.title || 'Product',
          price: item.price || 0,
          image: item.image || '',
          category: 'General',
          quantity: item.quantity
        }));
        set({ cart: cartItems });
        if (typeof window !== 'undefined') localStorage.setItem('ecomm_cart', JSON.stringify(cartItems));
      }
    } catch (e: any) {
      if (e.response?.status !== 401) {
        console.error('Failed to fetch cart', e);
      }
    }
  },
  addToCart: async (item) => {
    set((state) => {
      const existing = state.cart.find((c) => c.id === item.id);
      let newCart;
      if (existing) {
        newCart = state.cart.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      } else {
        newCart = [...state.cart, { ...item, quantity: 1 }];
      }
      if (typeof window !== 'undefined') localStorage.setItem('ecomm_cart', JSON.stringify(newCart));
      return { cart: newCart };
    });

    try {
      await api.post('/api/v1/cart/items', { productId: item.id, quantity: 1 });
    } catch (e) {
      console.error('Failed to sync addToCart', e);
    }
  },
  removeFromCart: async (id) => {
    set((state) => {
      const newCart = state.cart.filter((c) => c.id !== id);
      if (typeof window !== 'undefined') localStorage.setItem('ecomm_cart', JSON.stringify(newCart));
      return { cart: newCart };
    });

    try {
      await api.delete(`/api/v1/cart/items/${id}`);
    } catch (e) {
      console.error('Failed to sync removeFromCart', e);
    }
  },
  updateQuantity: async (id, quantity) => {
    set((state) => {
      const newCart = quantity <= 0
        ? state.cart.filter((c) => c.id !== id)
        : state.cart.map((c) => c.id === id ? { ...c, quantity } : c);
      if (typeof window !== 'undefined') localStorage.setItem('ecomm_cart', JSON.stringify(newCart));
      return { cart: newCart };
    });

    if (quantity <= 0) {
      try { await api.delete(`/api/v1/cart/items/${id}`); } catch(e){}
    } else {
      try { await api.put(`/api/v1/cart/items/${id}`, { quantity }); } catch(e){}
    }
  },
  clearCart: async () => {
    if (typeof window !== 'undefined') localStorage.removeItem('ecomm_cart');
    set({ cart: [] });
    // API lacks clearCart endpoint directly, so we just remove locally for now
  },
  cartTotal: () => get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  cartCount: () => get().cart.reduce((sum, item) => sum + item.quantity, 0),

  // Auth
  ...loadUser(),
  login: async (user) => {
    if (typeof window !== 'undefined') localStorage.setItem('ecomm_user', JSON.stringify(user));
    set({ user, isLoggedIn: true });
    
    // Merge guest cart with user cart
    try {
      const guestId = localStorage.getItem('ecomm_guest_id');
      if (guestId) {
        await api.post('/api/v1/cart/merge', { guestId });
      }
      get().fetchCart();
      
      // Fetch wishlist on login, and merge local items if any
      const localWishlist = get().wishlist;
      await get().fetchWishlist();
      
      // If we had local items, push them to the backend asynchronously
      if (localWishlist.length > 0) {
        for (const id of localWishlist) {
          if (!get().wishlist.includes(id)) {
            // It's not in the new state fetched from backend, so add it
            try {
              await api.post('/api/v1/wishlist/items', { productId: id });
            } catch(e){}
          }
        }
        // Fetch again to ensure sync
        get().fetchWishlist();
      }
    } catch(e) {
      console.error('Failed to merge on login', e);
    }
  },
  logout: async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch (e) {
      console.error('Logout API failed', e);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ecomm_user');
      localStorage.removeItem('ecomm_guest_id'); // force a new guest ID on next request
    }
    set({ user: null, isLoggedIn: false });
    get().clearCart(); // clear local cart
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  },
  updateUser: (updates) => {
    set((state) => {
      if (!state.user) return {};
      const newUser = { ...state.user, ...updates };
      if (typeof window !== 'undefined') localStorage.setItem('ecomm_user', JSON.stringify(newUser));
      return { user: newUser };
    });
  },

  // Wishlist
  wishlist: loadWishlist(),
  fetchWishlist: async () => {
    try {
      const res = await api.get('/api/v1/wishlist');
      if (res.data.success && res.data.data) {
        // Map over items to extract product_id
        const itemIds = res.data.data.items.map((item: any) => item.product_id);
        set({ wishlist: itemIds });
        if (typeof window !== 'undefined') localStorage.setItem('ecomm_wishlist', JSON.stringify(itemIds));
      }
    } catch (e) {
      console.error('Failed to fetch wishlist', e);
    }
  },
  toggleWishlist: (id) => {
    const state = get();
    const isAdding = !state.wishlist.includes(id);
    const newWishlist = isAdding
      ? [...state.wishlist, id]
      : state.wishlist.filter((w) => w !== id);
    
    // Optimistic UI update
    set({ wishlist: newWishlist });
    if (typeof window !== 'undefined') localStorage.setItem('ecomm_wishlist', JSON.stringify(newWishlist));

    // Sync with backend if logged in
    if (state.isLoggedIn) {
      if (isAdding) {
        api.post('/api/v1/wishlist/items', { productId: id }).catch(e => {
          console.error('Failed to add to wishlist', e);
          // Revert on failure (optional but good practice)
          // set({ wishlist: state.wishlist });
        });
      } else {
        api.delete(`/api/v1/wishlist/items/${id}`).catch(e => {
          console.error('Failed to remove from wishlist', e);
        });
      }
    }
  },

  // Search
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  // Seller Hub
  storeProfile: null,
  setStoreProfile: (profile) => set({ storeProfile: profile }),
}));
