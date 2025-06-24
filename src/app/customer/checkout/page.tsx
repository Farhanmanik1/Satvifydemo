"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useCart } from "@/store/cart";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function CheckoutPage() {
  const items = useCart((state) => state.items);
  const clearCart = useCart((state) => state.clearCart);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [landmark, setLandmark] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (items.length === 0 && !orderPlaced) {
      router.replace("/customer/cart");
    }
  }, [items, orderPlaced, router]);

  const isValidIndianPhone = (num: string) => {
    // Indian mobile numbers: 10 digits, start with 6-9
    return /^([6-9][0-9]{9})$/.test(num);
  };

  const fetchAddressFromCoords = async (lat: number, lon: number) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    if (!res.ok) throw new Error("Failed to fetch address");
    const data = await res.json();
    return data.address;
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);
        setLocationError("");
        try {
          const address = await fetchAddressFromCoords(lat, lon);
          const formatted = [
            address.road,
            address.suburb,
            address.city || address.town,
            address.state,
            address.postcode,
            address.country,
          ].filter(Boolean).join(", ");
          setAddress(formatted);
        } catch (err) {
          setLocationError("Could not fetch address from location.");
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        setLocationError("Unable to retrieve your location. Please allow location access.");
        setLocationLoading(false);
      }
    );
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isValidIndianPhone(phone)) {
      setError("Please enter a valid 10-digit Indian phone number.");
      return;
    }
    if (!address.trim()) {
      setError("Please enter a delivery address.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setLoading(true);
    try {
      // Get logged-in user from session
      const user = session?.user;
      if (!user) {
        setError("You must be logged in to place an order. Please log out and log in again if you see this message in error.");
        setLoading(false);
        return;
      }
      // Insert order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            customer_id: user.id,
            status: "pending",
            total_amount: total,
            payment_status: "pending",
            phone: phone,
            address: address,
            landmark: landmark,
            customer_latitude: latitude,
            customer_longitude: longitude,
            // Optionally store address/phone/name in a JSON field or add columns
          },
        ])
        .select()
        .single();
      if (orderError || !order) {
        setError("Failed to place order. Please try again.");
        setLoading(false);
        return;
      }
      // Insert order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));
      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) {
        setError("Order placed but failed to save items. Please contact support.");
        setLoading(false);
        return;
      }
      setOrderPlaced(true);
      clearCart();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Order placement error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Checkout</h1>
        {orderPlaced ? (
          <div className="bg-green-100 text-green-800 p-6 rounded shadow text-center font-semibold">
            Your order has been placed! Thank you for choosing Satvify1.<br />
            (Cash on Delivery)
          </div>
        ) : (
          <>
            <form className="bg-white p-6 rounded shadow mb-6" onSubmit={handlePlaceOrder}>
              <div className="mb-4">
                <label className="block font-semibold mb-1 text-gray-900">Name</label>
                <input
                  type="text"
                  className="w-full border rounded p-2 text-gray-900"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1 text-gray-900">Phone</label>
                <input
                  type="tel"
                  className="w-full border rounded p-2 text-gray-900"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  pattern="[6-9]{1}[0-9]{9}"
                  maxLength={10}
                  minLength={10}
                />
                {error && <div className="text-red-600 mt-1 text-sm">{error}</div>}
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1 text-gray-900">Delivery Address</label>
                <textarea
                  className="w-full border rounded p-2 text-gray-900"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1 text-gray-900">Nearest Landmark (optional)</label>
                <input
                  type="text"
                  className="w-full border rounded p-2 text-gray-900"
                  value={landmark}
                  onChange={e => setLandmark(e.target.value)}
                  placeholder="e.g. Near City Mall, Opposite SBI ATM"
                />
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1 text-gray-900">Delivery Location</label>
                <button type="button" onClick={handleGetLocation} className="bg-blue-600 text-white px-3 py-1 rounded font-medium hover:bg-blue-700 transition mb-2" disabled={locationLoading}>
                  {locationLoading ? "Getting location..." : "Use my current location"}
                </button>
                {latitude && longitude && !locationLoading && (
                  <div className="text-green-700 text-sm">Location set: {latitude.toFixed(5)}, {longitude.toFixed(5)}</div>
                )}
                {locationError && <div className="text-red-600 text-sm">{locationError}</div>}
              </div>
              <div className="bg-white p-6 rounded shadow mb-6">
                <h2 className="text-lg font-bold mb-2 text-blue-700">Order Summary</h2>
                <ul className="divide-y divide-gray-200 mb-4 text-black">
                  {items.map(item => (
                    <li key={item.id} className="py-2 flex justify-between text-black">
                      <span className="text-black">{item.name} x {item.quantity}</span>
                      <span className="text-black">₹{item.price * item.quantity}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between font-bold text-lg text-black">
                  <span className="text-black">Total:</span>
                  <span className="text-blue-700">₹{total}</span>
                </div>
              </div>
              <button type="submit" className="w-full bg-green-600 text-black py-2 rounded font-semibold hover:bg-green-700 transition" disabled={loading}>
                {loading ? "Placing Order..." : "Place Order (Cash on Delivery)"}
              </button>
            </form>
          </>
        )}
      </main>
    </>
  );
} 