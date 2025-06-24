"use client";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from 'react-hot-toast';

interface Order {
  id: string;
  status: string;
  order_time: string;
  total_amount: number;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product_name?: string;
}

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ReturnRequest {
  id: string;
  order_item_id: string;
  customer_id: string;
  reason: string;
  type: 'return' | 'replacement';
  status: 'requested' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  processed_at?: string;
}

export default function OrdersPage() {
  const [session, setSession] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<{ [orderId: string]: OrderItem[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState<{ [productId: string]: Review | null }>({});
  const [showReviewForm, setShowReviewForm] = useState<{ [productId: string]: boolean }>({});
  const [reviewInputs, setReviewInputs] = useState<{ [productId: string]: { rating: number; comment: string } }>({});
  const [submittingReview, setSubmittingReview] = useState<{ [productId: string]: boolean }>({});
  const [returnRequests, setReturnRequests] = useState<{ [orderItemId: string]: ReturnRequest | null }>({});
  const [showReturnForm, setShowReturnForm] = useState<{ [orderItemId: string]: boolean }>({});
  const [returnInputs, setReturnInputs] = useState<{ [orderItemId: string]: { type: 'return' | 'replacement'; reason: string } }>({});
  const [submittingReturn, setSubmittingReturn] = useState<{ [orderItemId: string]: boolean }>({});

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
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      if (!session?.user) {
        setError("You must be logged in to view your orders.");
        setLoading(false);
        return;
      }
      // Fetch orders for this user
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id, status, order_time, total_amount")
        .eq("customer_id", session.user.id)
        .order("order_time", { ascending: false });
      if (ordersError) {
        setError("Failed to fetch orders.");
        setLoading(false);
        return;
      }
      setOrders(ordersData || []);
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
    fetchOrders();
  }, [session?.user]);

  // Fetch reviews for all ordered products by this user
  useEffect(() => {
    if (!session?.user || Object.keys(orderItems).length === 0) return;
    const allProductIds = Object.values(orderItems).flat().map(item => item.product_id);
    if (allProductIds.length === 0) return;
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("id, product_id, user_id, rating, comment, created_at")
        .in("product_id", allProductIds)
        .eq("user_id", session.user.id);
      if (!error && data) {
        const map: { [productId: string]: Review | null } = {};
        allProductIds.forEach(pid => {
          map[pid] = data.find((r: Review) => r.product_id === pid) || null;
        });
        setReviews(map);
      }
    };
    fetchReviews();
  }, [session?.user, orderItems]);

  // Fetch return requests for all order items
  useEffect(() => {
    if (!session?.user || Object.keys(orderItems).length === 0) return;
    const allOrderItemIds = Object.values(orderItems).flat().map(item => item.id);
    if (allOrderItemIds.length === 0) return;
    const fetchReturns = async () => {
      const { data, error } = await supabase
        .from("order_returns")
        .select("id, order_item_id, customer_id, reason, type, status, created_at, processed_at")
        .in("order_item_id", allOrderItemIds)
        .eq("customer_id", session.user.id);
      if (!error && data) {
        const map: { [orderItemId: string]: ReturnRequest | null } = {};
        allOrderItemIds.forEach(oid => {
          map[oid] = data.find((r: ReturnRequest) => r.order_item_id === oid) || null;
        });
        setReturnRequests(map);
      }
    };
    fetchReturns();
  }, [session?.user, orderItems]);

  useEffect(() => {
    if (!session?.user) return;
    // Subscribe to real-time order status updates
    const channel = supabase
      .channel(`order-status-${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${session.user.id}`,
        },
        (payload) => {
          // Refetch orders
          fetchOrders();
          // Show a toast notification
          const newStatus = payload.new.status;
          toast.success(`Order ${payload.new.id} status updated: ${newStatus}`);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user]);

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Your Orders</h1>
        {loading ? (
          <div className="text-gray-700">Loading your orders...</div>
        ) : error ? (
          <div className="text-red-600 font-semibold">{error}</div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-6 rounded shadow text-center">
            <p className="text-gray-700 mb-4">You have not placed any orders yet.</p>
            <a href="/customer/menu" className="text-blue-600 underline">Browse Menu</a>
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
                <div>
                  <span className="font-semibold">Items:</span>
                  <ul className="ml-4 mt-1 list-disc text-gray-900">
                    {(orderItems[order.id] || []).map(item => (
                      <li key={item.id}>
                        {item.product_name || item.product_id} x {item.quantity} <span className="text-gray-700">(₹{item.price})</span>
                        {/* Review section */}
                        <div className="ml-2 mt-1">
                          {reviews[item.product_id] ? (
                            <div className="text-xs text-green-700">Reviewed: {reviews[item.product_id]?.rating}★ - {reviews[item.product_id]?.comment}</div>
                          ) : order.status.toLowerCase() === "delivered" ? (
                            <>
                              <button
                                className="text-blue-600 underline text-xs mb-1"
                                onClick={() => setShowReviewForm(f => ({ ...f, [item.product_id]: !f[item.product_id] }))}
                              >
                                {showReviewForm[item.product_id] ? "Cancel" : "Leave a Review"}
                              </button>
                              {showReviewForm[item.product_id] && (
                                <form
                                  className="mb-2 flex flex-col gap-1"
                                  onSubmit={async e => {
                                    e.preventDefault();
                                    if (!session?.user) return;
                                    setSubmittingReview(f => ({ ...f, [item.product_id]: true }));
                                    const { rating, comment } = reviewInputs[item.product_id] || { rating: 5, comment: "" };
                                    await supabase.from("product_reviews").insert([
                                      {
                                        product_id: item.product_id,
                                        user_id: session.user.id,
                                        rating,
                                        comment,
                                      },
                                    ]);
                                    setShowReviewForm(f => ({ ...f, [item.product_id]: false }));
                                    setReviewInputs(f => ({ ...f, [item.product_id]: { rating: 5, comment: "" } }));
                                    setSubmittingReview(f => ({ ...f, [item.product_id]: false }));
                                    // Refresh reviews
                                    const { data } = await supabase
                                      .from("product_reviews")
                                      .select("id, product_id, user_id, rating, comment, created_at")
                                      .eq("product_id", item.product_id)
                                      .eq("user_id", session.user.id);
                                    setReviews(r => ({ ...r, [item.product_id]: data?.[0] || null }));
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs">Rating:</label>
                                    <select
                                      value={(reviewInputs[item.product_id]?.rating) || 5}
                                      onChange={e => setReviewInputs(f => ({ ...f, [item.product_id]: { ...f[item.product_id], rating: Number(e.target.value) } }))}
                                      className="border rounded px-2 py-1 text-xs"
                                    >
                                      {[1, 2, 3, 4, 5].map(n => (
                                        <option key={n} value={n}>{n}★</option>
                                      ))}
                                    </select>
                                  </div>
                                  <textarea
                                    className="border rounded px-2 py-1 text-xs w-full"
                                    placeholder="Write your review..."
                                    value={reviewInputs[item.product_id]?.comment || ""}
                                    onChange={e => setReviewInputs(f => ({ ...f, [item.product_id]: { ...f[item.product_id], comment: e.target.value } }))}
                                    rows={2}
                                    maxLength={300}
                                    required
                                  />
                                  <button
                                    type="submit"
                                    className="bg-blue-600 text-white rounded px-3 py-1 text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                                    disabled={submittingReview[item.product_id]}
                                  >
                                    {submittingReview[item.product_id] ? "Submitting..." : "Submit Review"}
                                  </button>
                                </form>
                              )}
                            </>
                          ) : (
                            <div className="text-xs text-gray-400 italic">You can review after delivery</div>
                          )}
                        </div>
                        {/* Return/Replacement section */}
                        <div className="ml-2 mt-1">
                          {order.status.toLowerCase() === "delivered" && !returnRequests[item.id] ? (
                            <>
                              <button
                                className="text-orange-600 underline text-xs mb-1"
                                onClick={() => setShowReturnForm(f => ({ ...f, [item.id]: !f[item.id] }))}
                              >
                                {showReturnForm[item.id] ? "Cancel" : "Return/Replace"}
                              </button>
                              {showReturnForm[item.id] && (
                                <form
                                  className="mb-2 flex flex-col gap-1"
                                  onSubmit={async e => {
                                    e.preventDefault();
                                    if (!session?.user) return;
                                    setSubmittingReturn(f => ({ ...f, [item.id]: true }));
                                    const { type, reason } = returnInputs[item.id] || { type: 'return', reason: '' };
                                    
                                    // Insert return request
                                    const { error: returnError } = await supabase.from("order_returns").insert([
                                      {
                                        order_item_id: item.id,
                                        customer_id: session.user.id,
                                        type,
                                        reason,
                                      },
                                    ]);
                                    
                                    if (returnError) {
                                      console.error("Error creating return request:", returnError);
                                    } else {
                                      console.log("Return request created successfully");
                                    }
                                    
                                    setShowReturnForm(f => ({ ...f, [item.id]: false }));
                                    setReturnInputs(f => ({ ...f, [item.id]: { type: 'return', reason: '' } }));
                                    setSubmittingReturn(f => ({ ...f, [item.id]: false }));
                                    // Refresh return requests
                                    const { data } = await supabase
                                      .from("order_returns")
                                      .select("id, order_item_id, customer_id, reason, type, status, created_at, processed_at")
                                      .eq("order_item_id", item.id)
                                      .eq("customer_id", session.user.id);
                                    setReturnRequests(r => ({ ...r, [item.id]: data?.[0] || null }));
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs">Type:</label>
                                    <select
                                      value={returnInputs[item.id]?.type || 'return'}
                                      onChange={e => setReturnInputs(f => ({ ...f, [item.id]: { ...f[item.id], type: e.target.value as 'return' | 'replacement' } }))}
                                      className="border rounded px-2 py-1 text-xs"
                                    >
                                      <option value="return">Return</option>
                                      <option value="replacement">Replacement</option>
                                    </select>
                                  </div>
                                  <textarea
                                    className="border rounded px-2 py-1 text-xs w-full"
                                    placeholder="Reason for return/replacement..."
                                    value={returnInputs[item.id]?.reason || ''}
                                    onChange={e => setReturnInputs(f => ({ ...f, [item.id]: { ...f[item.id], reason: e.target.value } }))}
                                    rows={2}
                                    maxLength={300}
                                    required
                                  />
                                  <button
                                    type="submit"
                                    className="bg-orange-600 text-white rounded px-3 py-1 text-xs font-semibold hover:bg-orange-700 disabled:opacity-50"
                                    disabled={submittingReturn[item.id]}
                                  >
                                    {submittingReturn[item.id] ? "Submitting..." : "Submit Request"}
                                  </button>
                                </form>
                              )}
                            </>
                          ) : returnRequests[item.id] ? (
                            <div className="text-xs text-orange-700">Return/Replacement: {returnRequests[item.id]?.type} - {returnRequests[item.id]?.status} <br />Reason: {returnRequests[item.id]?.reason}</div>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
} 