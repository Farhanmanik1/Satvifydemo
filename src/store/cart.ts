import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabaseClient';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  loadCart: () => Promise<void>;
  saveCart: () => Promise<void>;
  mergeGuestCartToUserCart: () => Promise<void>;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addToCart: (item) => {
        set((state) => {
          const existing = state.items.find(i => i.id === item.id);
          let newItems;
          const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
          if (existing) {
            newItems = state.items.map(i =>
              i.id === item.id ? { ...i, quantity: i.quantity + qty } : i
            );
          } else {
            newItems = [...state.items, { ...item, quantity: qty }];
          }
          setTimeout(get().saveCart, 0);
          return { items: newItems };
        });
      },
      removeFromCart: (id) => set((state) => {
        const newItems = state.items.filter(i => i.id !== id);
        setTimeout(get().saveCart, 0);
        return { items: newItems };
      }),
      updateQuantity: (id, quantity) => set((state) => {
        const newItems = state.items.map(i =>
          i.id === id ? { ...i, quantity } : i
        );
        setTimeout(get().saveCart, 0);
        return { items: newItems };
      }),
      clearCart: () => {
        set({ items: [] });
        setTimeout(get().saveCart, 0);
      },
      loadCart: async () => {
        const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
        if (!user) return;
        
        try {
          const { data, error } = await supabase
            .from('carts')
            .select('items')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (error) {
            console.warn('Failed to load cart from database:', error);
            // Don't throw error, just continue with empty cart
            return;
          }
          
          if (data && data.items) {
            set({ items: data.items });
          }
        } catch (err) {
          console.warn('Error loading cart:', err);
          // Continue with empty cart if there's an error
        }
      },
      saveCart: async () => {
        const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
        if (!user) return;
        
        try {
          const items = get().items;
          const { error } = await supabase.from('carts').upsert({
            user_id: user.id,
            items,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
          
          if (error) {
            console.warn('Failed to save cart to database:', error);
          }
        } catch (err) {
          console.warn('Error saving cart:', err);
        }
      },
      mergeGuestCartToUserCart: async () => {
        // Get guest cart from localStorage
        const guestCart = JSON.parse(localStorage.getItem('cart-storage') || '{"state":{"items":[]}}').state.items || [];
        if (!guestCart.length) return;
        // Load user cart from Supabase
        const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
        if (!user) return;
        const { data } = await supabase
          .from('carts')
          .select('items')
          .eq('user_id', user.id)
          .maybeSingle();
        let merged: CartItem[] = [];
        if (data && data.items) {
          // Merge guest and user cart
          const map = new Map<string, CartItem>();
          for (const item of [...data.items, ...guestCart]) {
            if (map.has(item.id)) {
              map.set(item.id, {
                ...item,
                quantity: map.get(item.id)!.quantity + item.quantity,
              });
            } else {
              map.set(item.id, { ...item });
            }
          }
          merged = Array.from(map.values());
        } else {
          merged = guestCart;
        }
        // Save merged cart to Supabase and Zustand
        set({ items: merged });
        await get().saveCart();
        // Clear guest cart
        localStorage.removeItem('cart-storage');
      },
    }),
    {
      name: 'cart-storage', // key in localStorage
    }
  )
);

export {}; 