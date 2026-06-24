import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
}

interface AppState {
  user: User | null;
  isLoggedIn: boolean;
  storeProfile: any | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  setStoreProfile: (profile: any) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      storeProfile: null,
      login: (userData, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('sellerAccessToken', token);
        }
        set({ user: userData, isLoggedIn: true });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('sellerAccessToken');
        }
        set({ user: null, isLoggedIn: false, storeProfile: null });
      },
      updateUser: (userData) => set((state) => ({ 
        user: state.user ? { ...state.user, ...userData } : null 
      })),
      setStoreProfile: (profile) => set({ storeProfile: profile }),
    }),
    {
      name: 'seller-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
