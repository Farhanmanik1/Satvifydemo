"use client";
import { useEffect } from "react";
import { useCart } from "@/store/cart";
import { supabase } from "@/lib/supabaseClient";

export default function CartSyncEffect() {
  useEffect(() => {
    async function syncCart() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await useCart.getState().mergeGuestCartToUserCart();
        await useCart.getState().loadCart();
      }
    }
    syncCart();
  }, []);
  return null;
} 