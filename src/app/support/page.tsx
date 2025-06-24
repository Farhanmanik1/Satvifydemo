"use client";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@supabase/auth-helpers-react";
import Link from "next/link";

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  customer_id: string;
  profiles: {
    full_name: string;
  } | null;
}

const STATUS_COLORS = {
  open: "text-blue-600 bg-blue-100",
  assigned: "text-purple-600 bg-purple-100",
  "in-progress": "text-orange-600 bg-orange-100",
  resolved: "text-green-600 bg-green-100",
  closed: "text-gray-600 bg-gray-100",
} as const;

const PRIORITY_COLORS = {
  low: "text-green-600 bg-green-100",
  medium: "text-yellow-600 bg-yellow-100",
  high: "text-red-600 bg-red-100",
} as const;

const CATEGORY_LABELS = {
  order: "Order Issues",
  delivery: "Delivery Issues", 
  food_quality: "Food Quality",
  payment: "Payment Issues",
  refund: "Refund Request",
  general: "General Inquiry",
} as const;

export default function SupportDashboard() {
  const session = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    if (!session?.user) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(data);
      }
      setAuthChecked(true);
    };

    fetchProfile();
  }, [session?.user]);

  useEffect(() => {
    if (profile && (profile.role === "support" || profile.role === "admin" || profile.role === "superadmin")) {
      fetchTickets();
    }
  }, [profile]);

  const fetchTickets = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (error.message.includes('relation "support_tickets" does not exist')) {
          setError("Support tickets table not found. Please run the database setup script first.");
        } else {
          setError(`Failed to fetch support tickets: ${error.message}`);
        }
        console.error("Error fetching tickets:", error);
        setTickets([]);
      } else {
        // Fetch customer profiles for each ticket
        const ticketsWithProfiles = await Promise.all(
          (data || []).map(async (ticket: any) => {
            let customerProfile = null;
            if (ticket.customer_id) {
              const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", ticket.customer_id)
                .single();
              
              if (!profileError && profileData) {
                customerProfile = { full_name: profileData.full_name };
              }
            }
            
            return {
              ...ticket,
              profiles: customerProfile
            };
          })
        );
        
        setTickets(ticketsWithProfiles as SupportTicket[]);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      console.error("Error:", err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ 
          status: newStatus,
          assigned_to: newStatus === "assigned" ? session?.user?.id : null,
          resolved_at: newStatus === "resolved" ? new Date().toISOString() : null
        })
        .eq("id", ticketId);

      if (error) {
        console.error("Error updating ticket status:", error);
      } else {
        fetchTickets(); // Refresh the list
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
    if (priorityFilter !== "all" && ticket.priority !== priorityFilter) return false;
    if (categoryFilter !== "all" && ticket.category !== categoryFilter) return false;
    return true;
  });

  const getTicketCounts = () => {
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === "open").length,
      assigned: tickets.filter(t => t.status === "assigned").length,
      inProgress: tickets.filter(t => t.status === "in-progress").length,
      resolved: tickets.filter(t => t.status === "resolved").length,
      high: tickets.filter(t => t.priority === "high").length,
    };
  };

  if (!session?.user || !authChecked) {
    return (
      <>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-red-100 text-red-800 p-6 rounded shadow text-center font-semibold">
            Please log in to access the support dashboard.
          </div>
        </main>
      </>
    );
  }

  if (authChecked && (!profile || !["support", "admin", "superadmin"].includes(profile.role))) {
    return (
      <>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-red-100 text-red-800 p-6 rounded shadow text-center font-semibold">
            Unauthorized: You do not have access to the support dashboard.
          </div>
        </main>
      </>
    );
  }

  const counts = getTicketCounts();

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-700">Support Dashboard</h1>
          <button
            onClick={fetchTickets}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{counts.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{counts.open}</div>
            <div className="text-sm text-gray-600">Open</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{counts.assigned}</div>
            <div className="text-sm text-gray-600">Assigned</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{counts.inProgress}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{counts.resolved}</div>
            <div className="text-sm text-gray-600">Resolved</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{counts.high}</div>
            <div className="text-sm text-gray-600">High Priority</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="order">Order Issues</option>
                <option value="delivery">Delivery Issues</option>
                <option value="food_quality">Food Quality</option>
                <option value="payment">Payment Issues</option>
                <option value="refund">Refund Request</option>
                <option value="general">General Inquiry</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Tickets List */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Support Tickets ({filteredTickets.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-600">Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No tickets found matching the current filters.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link
                          href={`/support/tickets/${ticket.id}`}
                          className="font-semibold text-blue-600 hover:text-blue-800"
                        >
                          {ticket.subject}
                        </Link>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            STATUS_COLORS[ticket.status as keyof typeof STATUS_COLORS]
                          }`}
                        >
                          {ticket.status.replace("-", " ").toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            PRIORITY_COLORS[ticket.priority as keyof typeof PRIORITY_COLORS]
                          }`}
                        >
                          {ticket.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Customer:</span> {ticket.profiles?.full_name || "Unknown"}
                        <span className="mx-2">•</span>
                        <span className="font-medium">Category:</span> {CATEGORY_LABELS[ticket.category as keyof typeof CATEGORY_LABELS]}
                      </div>
                      <div className="text-sm text-gray-500">
                        Created: {new Date(ticket.created_at).toLocaleString()}
                        {ticket.updated_at !== ticket.created_at && (
                          <span className="ml-4">
                            Updated: {new Date(ticket.updated_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {ticket.status === "open" && (
                        <button
                          onClick={() => updateTicketStatus(ticket.id, "assigned")}
                          className="bg-purple-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-purple-700 transition"
                        >
                          Assign to Me
                        </button>
                      )}
                      {ticket.status === "assigned" && (
                        <button
                          onClick={() => updateTicketStatus(ticket.id, "in-progress")}
                          className="bg-orange-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-orange-700 transition"
                        >
                          Start Work
                        </button>
                      )}
                      {ticket.status === "in-progress" && (
                        <button
                          onClick={() => updateTicketStatus(ticket.id, "resolved")}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700 transition"
                        >
                          Mark Resolved
                        </button>
                      )}
                      <Link
                        href={`/support/tickets/${ticket.id}`}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 transition"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
