"use client";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import dynamic from "next/dynamic";
import type { MapContainerProps, TileLayerProps, MarkerProps, PopupProps } from "react-leaflet";

interface Order {
  id: string;
  status: string;
  order_time: string;
  total_amount: number;
  customer_id: string;
  assigned_delivery?: string;
  address?: string;
  phone?: string;
  customer_latitude?: number;
  customer_longitude?: number;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product_name?: string;
}

const MapContainer = dynamic(
  () => import("react-leaflet").then(mod => mod.MapContainer),
  { ssr: false }
) as React.FC<MapContainerProps>;

const TileLayer = dynamic(
  () => import("react-leaflet").then(mod => mod.TileLayer),
  { ssr: false }
) as React.FC<TileLayerProps>;

const Marker = dynamic(
  () => import("react-leaflet").then(mod => mod.Marker),
  { ssr: false }
) as React.FC<MarkerProps>;

const Popup = dynamic(
  () => import("react-leaflet").then(mod => mod.Popup),
  { ssr: false }
) as React.FC<PopupProps>;

export default function DeliveryDashboard() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<{ [orderId: string]: OrderItem[] }>({});
  const [customerPhones, setCustomerPhones] = useState<{ [customerId: string]: string }>({});
  const [customerInfo, setCustomerInfo] = useState<{ [customerId: string]: { name: string; phone: string } }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()
          .then(({ data, error }) => {
            if (data) setProfile(data);
            setAuthChecked(true);
          });
      } else {
        setAuthChecked(true);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()
          .then(({ data, error }) => {
            if (data) setProfile(data);
            setAuthChecked(true);
          });
      } else {
        setAuthChecked(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!profile || (profile.role !== "delivery" && profile.role !== "superadmin")) return;
    fetchOrders();
    // Real-time subscription for delivery orders
    const channel = supabase.channel('realtime-delivery-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
      }, (payload) => {
        const newStatus = payload.new && typeof payload.new === 'object' && 'status' in payload.new ? (payload.new as { status?: string }).status : undefined;
        const oldStatus = payload.old && typeof payload.old === 'object' && 'status' in payload.old ? (payload.old as { status?: string }).status : undefined;
        if (["out-for-delivery"].includes(newStatus || "") || ["out-for-delivery"].includes(oldStatus || "")) {
          fetchOrders();
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    // Fetch all orders with status out-for-delivery
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("id, status, order_time, total_amount, customer_id, phone, address, customer_latitude, customer_longitude")
      .eq("status", "out-for-delivery")
      .order("order_time", { ascending: true });
    if (ordersError) {
      setError("Failed to fetch orders.");
      setLoading(false);
      return;
    }
    setOrders(ordersData || []);
    // Fetch order items for all orders
    if (ordersData && ordersData.length > 0) {
      const orderIds = ordersData.map((o: Order) => o.id);
      const customerIds = Array.from(new Set(ordersData.map((o: Order) => o.customer_id)));
      // Fetch customer names and phone numbers
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .in("id", customerIds);
      if (!profilesError && profilesData) {
        const infoMap: { [customerId: string]: { name: string; phone: string } } = {};
        profilesData.forEach((p: any) => {
          infoMap[p.id] = { name: p.full_name || "", phone: p.phone || "" };
        });
        setCustomerInfo(infoMap);
      }
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("id, order_id, product_id, quantity, price, products(name)")
        .in("order_id", orderIds);
      if (itemsError) {
        setError("Failed to fetch order items.");
        setLoading(false);
        return;
      }
      // Group items by order_id
      const grouped: { [orderId: string]: OrderItem[] } = {};
      (itemsData || []).forEach((item: any) => {
        const orderId = item.order_id;
        if (!grouped[orderId]) grouped[orderId] = [];
        grouped[orderId].push({
          ...item,
          product_name: item.products?.name || "",
        });
      });
      setOrderItems(grouped);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string) => {
    setUpdating(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ status: "delivered" })
      .eq("id", orderId);
    setUpdating(null);
    if (error) {
      setError("Failed to update order status.");
    } else {
      // Refetch orders immediately after marking as delivered
      fetchOrders();
    }
  };

  if (authChecked && (!profile || (profile.role !== "delivery" && profile.role !== "superadmin"))) {
    return (
      <>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-red-100 text-red-800 p-6 rounded shadow text-center font-semibold">
            Unauthorized: You do not have access to the delivery dashboard.
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Delivery Dashboard</h1>
        {loading ? (
          <div className="text-gray-700">Loading delivery orders...</div>
        ) : error ? (
          <div className="text-red-600 font-semibold">{error}</div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-6 rounded shadow text-center">
            <p className="text-gray-700 mb-4">No orders out for delivery.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded shadow p-4 text-black">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-semibold text-black">Order ID:</span> <span className="text-black">{order.id}</span>
                  </div>
                  <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700 uppercase">{order.status}</span>
                </div>
                <div className="text-black mb-2">Placed on: {new Date(order.order_time).toLocaleString()}</div>
                <div className="mb-2">
                  <span className="font-semibold text-black">Total:</span> <span className="text-blue-700 font-bold">₹{order.total_amount}</span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold text-black">Customer:</span> <span className="text-black">{customerInfo[order.customer_id]?.name || "N/A"}</span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold text-black">Phone:</span> <a href={`tel:${order.phone}`} className="text-blue-700 underline">{order.phone || "N/A"}</a>
                </div>
                {order.address && (
                  <div className="mb-2">
                    <span className="font-semibold text-black">Address:</span> <span className="text-black">{order.address}</span>
                    {order.customer_latitude && order.customer_longitude && (
                      <div className="mt-2">
                        <MapContainer center={[order.customer_latitude, order.customer_longitude]} zoom={16} style={{ height: 200, width: "100%" }}>
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker position={[order.customer_latitude, order.customer_longitude]}>
                            <Popup>Customer Location</Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <span className="font-semibold text-black">Items:</span>
                  <ul className="ml-4 mt-1 list-disc text-black">
                    {(orderItems[order.id] || []).map(item => (
                      <li key={item.id}>
                        <span className="text-black">{item.product_name || item.product_id} x {item.quantity}</span> <span className="text-black">(₹{item.price})</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    className="bg-green-600 text-black px-3 py-1 rounded font-semibold hover:bg-green-700 transition"
                    disabled={updating === order.id}
                    onClick={() => updateOrderStatus(order.id)}
                  >
                    {updating === order.id ? "Updating..." : "Mark Delivered"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
} 