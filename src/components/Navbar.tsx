"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";
import CartSyncEffect from "@/components/CartSyncEffect";
import { supabase } from "@/lib/supabaseClient";
import { ShoppingCartIcon, UserCircleIcon, ClipboardIcon, Bars3Icon, XMarkIcon, HomeIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

export default function Navbar() {
  const router = useRouter();
  const items = useCart((state) => state.items);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const clearCart = useCart((state) => state.clearCart);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        router.push("/login");
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    clearCart();
    localStorage.removeItem("cart-storage");
    await supabase.auth.signOut();
  };

  const navLinks = [
    { href: "/customer/menu", label: "Menu", icon: <HomeIcon className="w-5 h-5 mr-2" /> },
    { href: "/customer/cart", label: "Cart", icon: <ShoppingCartIcon className="w-5 h-5 mr-2" />, badge: cartCount },
    { href: "/customer/orders", label: "Orders", icon: <ClipboardIcon className="w-5 h-5 mr-2" /> },
    { href: "/customer/support", label: "Support", icon: <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" /> },
    { href: "/customer/settings", label: "Settings", icon: <UserCircleIcon className="w-5 h-5 mr-2" /> },
  ];

  // Helper to determine if a link is active (client-side only, fallback to false on SSR)
  let activePath = "";
  if (typeof window !== "undefined") {
    activePath = window.location.pathname;
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <CartSyncEffect />
      <nav className="bg-gradient-to-r from-blue-100 via-white to-blue-200 shadow-xl mb-8 rounded-b-3xl border-b border-blue-200 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Branding */}
          <div className="flex items-center gap-3">
            <img src="/file.svg" alt="Satvify1 Logo" className="w-10 h-10 drop-shadow" />
            <Link href="/customer" className="text-3xl font-extrabold text-blue-700 tracking-tight drop-shadow">Satvify1</Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center px-4 py-2 rounded-xl font-semibold transition-all duration-150 mx-1 ${activePath.startsWith(link.href) ? "bg-blue-200 text-blue-800 shadow" : "text-gray-900 hover:bg-blue-100 hover:text-blue-700"}`}
              >
                {link.icon}
                {link.label}
                {typeof link.badge === "number" && link.badge > 0 && (
                  <span className="ml-1 absolute -top-2 -right-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white text-xs rounded-full px-2 py-0.5 font-bold animate-bounce shadow-lg border-2 border-white">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="ml-6 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold px-6 py-2 rounded-full shadow-lg transition-all duration-150 border-none text-base"
            >
              Logout
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-blue-100 focus:outline-none"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Open menu"
          >
            {mobileOpen ? <XMarkIcon className="w-8 h-8 text-blue-700" /> : <Bars3Icon className="w-8 h-8 text-blue-700" />}
          </button>
        </div>
        {/* Mobile Nav Drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-blue-200 px-4 pb-4 pt-2 rounded-b-3xl shadow-xl animate-fade-in z-50">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center px-4 py-3 rounded-xl font-semibold mb-2 transition-all duration-150 ${activePath.startsWith(link.href) ? "bg-blue-200 text-blue-800 shadow" : "text-gray-900 hover:bg-blue-100 hover:text-blue-700"}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.icon}
                {link.label}
                {typeof link.badge === "number" && link.badge > 0 && (
                  <span className="ml-1 absolute -top-2 -right-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white text-xs rounded-full px-2 py-0.5 font-bold animate-bounce shadow-lg border-2 border-white">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
            <button
              onClick={() => { setMobileOpen(false); handleLogout(); }}
              className="w-full mt-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold px-6 py-2 rounded-full shadow-lg border-none text-base"
            >
              Logout
            </button>
          </div>
        )}
      </nav>
    </>
  );
} 