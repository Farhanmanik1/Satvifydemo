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
  const [searchOrderId, setSearchOrderId] = useState("");
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

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
    setFilteredOrders(data || []);
    setLoading(false);
  };

  // Filter orders based on search
  useEffect(() => {
    if (searchOrderId.trim()) {
      const filtered = orders.filter(order =>
        order.id.toLowerCase().includes(searchOrderId.toLowerCase())
      );
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [searchOrderId, orders]);

  // Analytics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Additional analytics
  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.order_time);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  }).length;

  const completedOrders = orders.filter(o => o.status === "delivered").length;
  const successRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : "0";

  const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : "0";

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-blue-700 mb-2">{totalOrders}</div>
                <div className="text-black font-semibold">Total Orders</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-green-700 mb-2">₹{totalRevenue}</div>
                <div className="text-black font-semibold">Total Revenue</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-orange-700 mb-2">{todayOrders}</div>
                <div className="text-black font-semibold">Today's Orders</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-purple-700 mb-2">₹{avgOrderValue}</div>
                <div className="text-black font-semibold">Avg Order Value</div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-black mb-4">Order Status Breakdown</h3>
                <div className="space-y-2">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="capitalize text-gray-700">{status.replace(/-/g, ' ')}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(count / totalOrders) * 100}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-black w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-black mb-4">Business Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Success Rate</span>
                    <span className="font-bold text-green-600">{successRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Completed Orders</span>
                    <span className="font-bold text-black">{completedOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Pending Orders</span>
                    <span className="font-bold text-orange-600">{statusCounts.pending || 0}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <h2 className="text-lg font-bold text-blue-700 mb-2 md:mb-0">Orders Management</h2>
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    placeholder="Search by Order ID..."
                    value={searchOrderId}
                    onChange={(e) => setSearchOrderId(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  <span className="text-sm text-gray-600">
                    {filteredOrders.length} of {totalOrders} orders
                  </span>
                </div>
              </div>
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
                    {filteredOrders.slice(0, 20).map(order => (
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