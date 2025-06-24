"use client";
import Navbar from "@/components/Navbar";
import { useCart } from "@/store/cart";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart } = useCart();
  const router = useRouter();
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Your Cart</h1>
        {items.length === 0 ? (
          <div className="bg-white p-6 rounded shadow text-center">
            <p className="text-gray-700 mb-4">Your cart is empty.</p>
            <a href="/customer/menu" className="text-blue-600 underline">Browse Menu</a>
          </div>
        ) : (
          <div className="bg-white p-6 rounded shadow">
            <ul className="divide-y divide-gray-200 mb-4">
              {items.map(item => (
                <li key={item.id} className="py-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{item.name}</div>
                    <div className="text-gray-700">₹{item.price} x </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-2 py-1 bg-gray-200 rounded text-black"
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    >-</button>
                    <span className="w-8 text-center text-black">{item.quantity}</span>
                    <button
                      className="px-2 py-1 bg-gray-200 rounded text-black"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >+</button>
                    <button
                      className="ml-4 text-red-600 hover:underline"
                      onClick={() => removeFromCart(item.id)}
                    >Remove</button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-lg">Total:</span>
              <span className="font-bold text-lg text-blue-700">₹{total}</span>
            </div>
            <button
              className="w-full bg-blue-600 text-black py-2 rounded font-semibold hover:bg-blue-700 transition mb-2"
              onClick={() => router.push("/customer/checkout")}
            >
              Proceed to Checkout
            </button>
            <button className="w-full bg-gray-200 text-black py-2 rounded font-semibold hover:bg-gray-300 transition" onClick={clearCart}>
              Clear Cart
            </button>
          </div>
        )}
      </main>
    </>
  );
} 