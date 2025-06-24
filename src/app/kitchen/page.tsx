"use client";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Order {
  id: string;
  status: string;
  order_time: string;
  total_amount: number;
  customer_id: string;
  assigned_delivery?: string;
  address?: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product_name?: string;
}

export default function KitchenDashboard() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<{ [orderId: string]: OrderItem[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [deliveryAgents, setDeliveryAgents] = useState<any[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);

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
    if (!session?.user) return;
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      setProfile(data);
      setAuthChecked(true);
    };
    fetchProfile();
  }, [session?.user]);

  useEffect(() => {
    if (!profile || (profile.role !== "kitchen" && profile.role !== "superadmin")) return;
    fetchOrders();
    fetchDeliveryAgents();
    // Real-time subscription for orders
    const channel = supabase.channel('realtime-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
      }, (payload) => {
        const newStatus = payload.new && typeof payload.new === 'object' ? (payload.new as Order).status : undefined;
        const oldStatus = payload.old && typeof payload.old === 'object' ? (payload.old as Order).status : undefined;
        if (["pending", "in-kitchen"].includes(newStatus || "") || ["pending", "in-kitchen"].includes(oldStatus || "")) {
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
    // Fetch all orders with status pending or in-kitchen
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("id, status, order_time, total_amount, customer_id, assigned_delivery, address")
      .in("status", ["pending", "in-kitchen"])
      .order("order_time", { ascending: true });
    if (ordersError) {
      setError("Failed to fetch orders.");
      setLoading(false);
      return;
    }
    setOrders((ordersData || []) as Order[]);
    // Fetch order items for all orders
    if (ordersData && ordersData.length > 0) {
      const orderIds = ordersData.map((o: Order) => o.id);
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

  const fetchDeliveryAgents = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, delivery_area")
      .eq("role", "delivery");
    setDeliveryAgents(data || []);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);
    setUpdating(null);
    if (error) {
      setError("Failed to update order status.");
    } else {
      fetchOrders();
    }
  };

  const assignDeliveryAgent = async (orderId: string, agentId: string) => {
    setAssigning(orderId);
    await supabase.from("orders").update({ assigned_delivery: agentId }).eq("id", orderId);
    await fetchOrders();
    setAssigning(null);
  };

  if (authChecked && (!profile || (profile.role !== "kitchen" && profile.role !== "superadmin"))) {
    return (
      <>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-red-100 text-red-800 p-6 rounded shadow text-center font-semibold">
            Unauthorized: You do not have access to the kitchen dashboard.
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Kitchen Dashboard</h1>
        {loading ? (
          <div className="text-gray-700">Loading orders...</div>
        ) : error ? (
          <div className="text-red-600 font-semibold">{error}</div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-6 rounded shadow text-center">
            <p className="text-gray-700 mb-4">No pending or in-kitchen orders.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-semibold text-gray-900">Order ID:</span> <span className="text-gray-700">{order.id}</span>
                  </div>
                  <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700 uppercase">{order.status}</span>
                </div>
                <div className="text-gray-700 mb-2">Placed on: {new Date(order.order_time).toLocaleString()}</div>
                <div className="mb-2">
                  <span className="font-semibold">Total:</span> <span className="text-blue-700 font-bold">₹{order.total_amount}</span>
                </div>
                {order.address && (
                  <div className="mb-2">
                    <span className="font-semibold">Address:</span> <span className="text-black">{order.address}</span>
                  </div>
                )}
                <div>
                  <span className="font-semibold">Items:</span>
                  <ul className="ml-4 mt-1 list-disc text-gray-900">
                    {(orderItems[order.id] || []).map(item => (
                      <li key={item.id}>
                        {item.product_name || item.product_id} x {item.quantity} <span className="text-gray-700">(₹{item.price})</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 flex gap-2 items-center">
                  {order.status === "pending" && (
                    <button
                      className="bg-yellow-500 text-black px-3 py-1 rounded font-semibold hover:bg-yellow-600 transition"
                      disabled={updating === order.id}
                      onClick={() => updateOrderStatus(order.id, "in-kitchen")}
                    >
                      {updating === order.id ? "Updating..." : "Mark In-Kitchen"}
                    </button>
                  )}
                  {order.status === "in-kitchen" && (
                    <>
                      <button
                        className="bg-green-600 text-black px-3 py-1 rounded font-semibold hover:bg-green-700 transition"
                        disabled={updating === order.id || !order.assigned_delivery}
                        onClick={() => updateOrderStatus(order.id, "out-for-delivery")}
                      >
                        {updating === order.id ? "Updating..." : "Mark Out for Delivery"}
                      </button>
                      <span className="ml-4 font-semibold">Assign Delivery Agent:</span>
                      <select
                        className="border rounded px-2 py-1 text-black bg-white ml-2"
                        value={order.assigned_delivery || ""}
                        onChange={e => assignDeliveryAgent(order.id, e.target.value)}
                        disabled={assigning === order.id}
                      >
                        <option value="">Select agent</option>
                        {deliveryAgents.map(agent => (
                          <option key={agent.id} value={agent.id}>
                            {agent.full_name}{agent.delivery_area ? ` (${agent.delivery_area})` : ""}
                          </option>
                        ))}
                      </select>
                      {assigning === order.id && <span className="ml-2 text-xs text-blue-700">Assigning...</span>}
                      {order.assigned_delivery && (
                        <span className="ml-2 text-green-700 text-sm">Assigned: {deliveryAgents.find(a => a.id === order.assigned_delivery)?.full_name || order.assigned_delivery}</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
} 