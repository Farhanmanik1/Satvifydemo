"use client";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Order {
  id: string;
  status: string;
  order_time: string;
  total_amount: number;
}

interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  role: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [session, setSession] = useState<any>(null);

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
    fetchOrders();
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

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("orders")
      .select("id, status, order_time, total_amount")
      .order("order_time", { ascending: false });
    if (error) {
      setError("Failed to fetch orders.");
      setLoading(false);
      return;
    }
    setOrders(data || []);
    setLoading(false);
  };

  // Analytics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (authChecked && (!profile || (profile.role !== "superadmin" && profile.role !== "admin"))) {
    return (
      <>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-red-100 text-red-800 p-6 rounded shadow text-center font-semibold">
            Unauthorized: You do not have access to the admin dashboard.
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Admin Dashboard</h1>
        {loading ? (
          <div className="text-gray-700">Loading analytics...</div>
        ) : error ? (
          <div className="text-red-600 font-semibold">{error}</div>
        ) : (
          <>
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-blue-700 mb-2">{totalOrders}</div>
                <div className="text-black font-semibold">Total Orders</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-green-700 mb-2">₹{totalRevenue}</div>
                <div className="text-black font-semibold">Total Revenue</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-lg font-bold text-black mb-2">Order Status</div>
                <ul className="text-left text-black">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <li key={status} className="flex justify-between">
                      <span className="capitalize">{status.replace(/-/g, ' ')}</span>
                      <span className="font-bold">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* Recent Orders Table */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold mb-4 text-blue-700">Recent Orders</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-black">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="px-4 py-2 text-left">Order ID</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 10).map(order => (
                      <tr key={order.id} className="border-b">
                        <td className="px-4 py-2 font-mono">{order.id}</td>
                        <td className="px-4 py-2 capitalize">{order.status.replace(/-/g, ' ')}</td>
                        <td className="px-4 py-2">{new Date(order.order_time).toLocaleString()}</td>
                        <td className="px-4 py-2 text-blue-700 font-bold">₹{order.total_amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
} 