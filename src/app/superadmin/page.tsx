"use client";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import React from "react";

interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  role: string;
  created_at: string;
  delivery_area?: string;
}

export default function SuperAdminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [userOrdersLoading, setUserOrdersLoading] = useState(false);
  const [userOrdersError, setUserOrdersError] = useState("");
  const [openSection, setOpenSection] = useState<'customers' | 'staff' | 'delivery' | null>('customers');
  const [userSearch, setUserSearch] = useState("");
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);
  const [areaEditing, setAreaEditing] = useState<string | null>(null);
  const [areaValue, setAreaValue] = useState<{ [id: string]: string }>({});

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
    fetchUsers();
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

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError("");
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role, created_at, delivery_area");
    if (error) {
      setUsersError("Failed to fetch users.");
      setUsersLoading(false);
      return;
    }
    setUsers(data || []);
    // Set initial area values for delivery agents
    const areaMap: { [id: string]: string } = {};
    (data || []).forEach((u: any) => {
      if (u.role === "delivery") areaMap[u.id] = u.delivery_area || "";
    });
    setAreaValue(areaMap);
    setUsersLoading(false);
  };

  const handleExpandUser = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      setUserOrders([]);
      setUserOrdersError("");
      return;
    }
    setExpandedUserId(userId);
    setUserOrdersLoading(true);
    setUserOrdersError("");
    const { data, error } = await supabase
      .from("orders")
      .select("id, status, order_time, total_amount")
      .eq("customer_id", userId)
      .order("order_time", { ascending: false });
    if (error) {
      setUserOrdersError("Failed to fetch user orders.");
      setUserOrders([]);
      setUserOrdersLoading(false);
      return;
    }
    setUserOrders(data || []);
    setUserOrdersLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setRoleUpdating(userId);
    await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    await fetchUsers();
    setRoleUpdating(null);
  };

  const handleAreaSave = async (userId: string) => {
    setAreaEditing(userId);
    await supabase.from("profiles").update({ delivery_area: areaValue[userId] }).eq("id", userId);
    await fetchUsers();
    setAreaEditing(null);
  };

  // Group users by role
  const staff = users.filter(u => ["kitchen", "support", "admin", "superadmin"].includes(u.role));
  const deliveryAgents = users.filter(u => u.role === "delivery");
  const customers = users.filter(u => u.role === "customer");

  if (authChecked && (!profile || profile.role !== "superadmin")) {
    return (
      <>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-red-100 text-red-800 p-6 rounded shadow text-center font-semibold">
            Unauthorized: You do not have access to the superadmin dashboard.
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Super Admin Dashboard</h1>
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-10">
          <h2 className="text-2xl font-bold mb-6 text-blue-700 border-b pb-2">All Users & Staff</h2>
          <div className="mb-6 flex items-center gap-3">
            <input
              type="text"
              placeholder="Search by User ID..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full max-w-md text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {usersLoading ? (
            <div className="text-gray-700">Loading users...</div>
          ) : usersError ? (
            <div className="text-red-600 font-semibold">{usersError}</div>
          ) : (
            <>
              {/* Customers Dropdown */}
              <div className="mb-6">
                <button
                  className="w-full flex justify-between items-center bg-blue-50 px-4 py-3 rounded-t-xl font-bold text-lg text-black border-b focus:outline-none"
                  onClick={() => setOpenSection(openSection === 'customers' ? null : 'customers')}
                >
                  Customers
                  <span>{openSection === 'customers' ? '▲' : '▼'}</span>
                </button>
                {openSection === 'customers' && (
                  <div className="overflow-x-auto rounded-b-xl shadow border-b border-l border-r border-blue-100">
                    <table className="min-w-full text-sm text-black">
                      <thead>
                        <tr className="bg-blue-50">
                          <th className="px-4 py-2 text-left">User ID</th>
                          <th className="px-4 py-2 text-left">Name</th>
                          <th className="px-4 py-2 text-left">Phone</th>
                          <th className="px-4 py-2 text-left">Joined</th>
                          <th className="px-4 py-2 text-left">Orders</th>
                          <th className="px-4 py-2 text-left">Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.filter(u => u.id.toLowerCase().includes(userSearch.toLowerCase())).map((user, idx) => (
                          <React.Fragment key={user.id}>
                            <tr className={`border-b cursor-pointer hover:bg-blue-100 transition ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`} onClick={() => handleExpandUser(user.id)}>
                              <td className="px-4 py-2 font-mono text-xs text-gray-700">{user.id}</td>
                              <td className="px-4 py-2 font-medium">{user.full_name}</td>
                              <td className="px-4 py-2">{user.phone}</td>
                              <td className="px-4 py-2">{new Date(user.created_at).toLocaleDateString()}</td>
                              <td className="px-4 py-2 text-blue-700 font-bold underline">View Orders</td>
                              <td className="px-4 py-2">
                                <select
                                  value={user.role}
                                  onChange={e => handleRoleChange(user.id, e.target.value)}
                                  className="border rounded px-2 py-1 text-black bg-white"
                                  disabled={roleUpdating === user.id}
                                >
                                  <option value="customer">customer</option>
                                  <option value="kitchen">kitchen</option>
                                  <option value="delivery">delivery</option>
                                  <option value="support">support</option>
                                  <option value="admin">admin</option>
                                  <option value="superadmin">superadmin</option>
                                </select>
                                {roleUpdating === user.id && <span className="ml-2 text-xs text-blue-700">Updating...</span>}
                              </td>
                            </tr>
                            {expandedUserId === user.id && (
                              <tr key={user.id + "-expanded"}>
                                <td colSpan={6} className="bg-blue-50 px-4 py-4 rounded-b-xl border-t">
                                  {userOrdersLoading ? (
                                    <div className="text-gray-700">Loading orders...</div>
                                  ) : userOrdersError ? (
                                    <div className="text-red-600 font-semibold">{userOrdersError}</div>
                                  ) : userOrders.length === 0 ? (
                                    <div className="text-gray-700">No orders found for this user.</div>
                                  ) : (
                                    <ul className="list-disc ml-6 space-y-1">
                                      {userOrders.map(order => (
                                        <li key={order.id} className="bg-white rounded px-3 py-1 shadow-sm border border-gray-200">
                                          <span className="font-mono text-xs text-gray-700">{order.id}</span> — <span className="capitalize font-semibold text-blue-700">{order.status.replace(/-/g, ' ')}</span> — <span className="font-bold">₹{order.total_amount}</span> — <span className="text-gray-700">{new Date(order.order_time).toLocaleString()}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {/* Staff Dropdown */}
              <div className="mb-6">
                <button
                  className="w-full flex justify-between items-center bg-blue-50 px-4 py-3 rounded-t-xl font-bold text-lg text-black border-b focus:outline-none"
                  onClick={() => setOpenSection(openSection === 'staff' ? null : 'staff')}
                >
                  Staff
                  <span>{openSection === 'staff' ? '▲' : '▼'}</span>
                </button>
                {openSection === 'staff' && (
                  <div className="overflow-x-auto rounded-b-xl shadow border-b border-l border-r border-blue-100">
                    <table className="min-w-full text-sm text-black">
                      <thead>
                        <tr className="bg-blue-50">
                          <th className="px-4 py-2 text-left">User ID</th>
                          <th className="px-4 py-2 text-left">Name</th>
                          <th className="px-4 py-2 text-left">Phone</th>
                          <th className="px-4 py-2 text-left">Role</th>
                          <th className="px-4 py-2 text-left">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staff.filter(u => u.id.toLowerCase().includes(userSearch.toLowerCase())).map((user, idx) => (
                          <React.Fragment key={user.id}>
                            <tr className={`${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b`}>
                              <td className="px-4 py-2 font-mono text-xs text-gray-700">{user.id}</td>
                              <td className="px-4 py-2 font-medium">{user.full_name}</td>
                              <td className="px-4 py-2">{user.phone}</td>
                              <td className="px-4 py-2">
                                <select
                                  value={user.role}
                                  onChange={e => handleRoleChange(user.id, e.target.value)}
                                  className="border rounded px-2 py-1 text-black bg-white"
                                  disabled={roleUpdating === user.id}
                                >
                                  <option value="customer">customer</option>
                                  <option value="kitchen">kitchen</option>
                                  <option value="delivery">delivery</option>
                                  <option value="support">support</option>
                                  <option value="admin">admin</option>
                                  <option value="superadmin">superadmin</option>
                                </select>
                                {roleUpdating === user.id && <span className="ml-2 text-xs text-blue-700">Updating...</span>}
                              </td>
                              <td className="px-4 py-2">{new Date(user.created_at).toLocaleDateString()}</td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {/* Delivery Agents Dropdown */}
              <div>
                <button
                  className="w-full flex justify-between items-center bg-blue-50 px-4 py-3 rounded-t-xl font-bold text-lg text-black border-b focus:outline-none"
                  onClick={() => setOpenSection(openSection === 'delivery' ? null : 'delivery')}
                >
                  Delivery Agents
                  <span>{openSection === 'delivery' ? '▲' : '▼'}</span>
                </button>
                {openSection === 'delivery' && (
                  <div className="overflow-x-auto rounded-b-xl shadow border-b border-l border-r border-blue-100">
                    <table className="min-w-full text-sm text-black">
                      <thead>
                        <tr className="bg-blue-50">
                          <th className="px-4 py-2 text-left">User ID</th>
                          <th className="px-4 py-2 text-left">Name</th>
                          <th className="px-4 py-2 text-left">Phone</th>
                          <th className="px-4 py-2 text-left">Role</th>
                          <th className="px-4 py-2 text-left">Area/Zone</th>
                          <th className="px-4 py-2 text-left">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveryAgents.filter(u => u.id.toLowerCase().includes(userSearch.toLowerCase())).map((user, idx) => (
                          <React.Fragment key={user.id}>
                            <tr key={user.id} className={`${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b`}>
                              <td className="px-4 py-2 font-mono text-xs text-gray-700">{user.id}</td>
                              <td className="px-4 py-2 font-medium">{user.full_name}</td>
                              <td className="px-4 py-2">{user.phone}</td>
                              <td className="px-4 py-2">
                                <select
                                  value={user.role}
                                  onChange={e => handleRoleChange(user.id, e.target.value)}
                                  className="border rounded px-2 py-1 text-black bg-white"
                                  disabled={roleUpdating === user.id}
                                >
                                  <option value="customer">customer</option>
                                  <option value="kitchen">kitchen</option>
                                  <option value="delivery">delivery</option>
                                  <option value="support">support</option>
                                  <option value="admin">admin</option>
                                  <option value="superadmin">superadmin</option>
                                </select>
                                {roleUpdating === user.id && <span className="ml-2 text-xs text-blue-700">Updating...</span>}
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="text"
                                  className="border rounded px-2 py-1 text-black bg-white w-32"
                                  placeholder="Area/Zone"
                                  value={areaValue[user.id] || ""}
                                  onChange={e => setAreaValue(v => ({ ...v, [user.id]: e.target.value }))}
                                  disabled={areaEditing === user.id}
                                />
                                <button
                                  type="button"
                                  className="ml-2 px-2 py-1 bg-blue-600 text-black rounded font-semibold hover:bg-blue-700 transition text-xs"
                                  onClick={() => handleAreaSave(user.id)}
                                  disabled={areaEditing === user.id}
                                >
                                  {areaEditing === user.id ? "Saving..." : "Save"}
                                </button>
                              </td>
                              <td className="px-4 py-2">{new Date(user.created_at).toLocaleDateString()}</td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
} 