"use client";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/store/cart";
import { useSession } from "@supabase/auth-helpers-react";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  tags: string[];
  available: boolean;
  category?: string;
  image_url?: string;
  benefits?: string;
}

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const session = useSession();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    console.log('Product ID param:', params.productId);
    if (!params.productId || typeof params.productId !== 'string') {
      setError('Invalid product ID in URL.');
      setLoading(false);
      return;
    }
    const fetchProduct = async () => {
      setLoading(true);
      setError("");
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, tags, available, category, image_url, benefits")
        .eq("id", params.productId)
        .single();
      if (error || !data) {
        setError(`Product not found. (ID: ${params.productId})`);
        setLoading(false);
        return;
      }
      setProduct(data);
      setLoading(false);
    };
    fetchProduct();
  }, [params.productId]);

  useEffect(() => {
    if (!product) return;
    fetchReviews();
  }, [product]);

  const fetchReviews = async () => {
    if (!product) return;
    const { data, error } = await supabase
      .from("product_reviews")
      .select(`
        id, product_id, user_id, rating, comment, created_at,
        profiles(full_name)
      `)
      .eq("product_id", product.id)
      .order("created_at", { ascending: false });
    if (!error && data) setReviews(data);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      setReviewError("Please log in to submit a review");
      return;
    }

    setSubmittingReview(true);
    setReviewError("");

    try {
      const { error } = await supabase
        .from("product_reviews")
        .insert([
          {
            product_id: product?.id,
            user_id: session.user.id,
            rating: newReview.rating,
            comment: newReview.comment.trim(),
          },
        ]);

      if (error) {
        setReviewError("Failed to submit review. Please try again.");
      } else {
        setNewReview({ rating: 5, comment: "" });
        fetchReviews(); // Refresh reviews
      }
    } catch (err) {
      setReviewError("An error occurred while submitting your review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const renderStars = (rating: number, interactive = false, onStarClick?: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => {
      const filled = i < rating;
      const StarComponent = filled ? StarIcon : StarOutlineIcon;
      return (
        <StarComponent
          key={i}
          className={`h-5 w-5 ${filled ? 'text-yellow-400' : 'text-gray-300'} ${
            interactive ? 'cursor-pointer hover:text-yellow-400' : ''
          }`}
          onClick={interactive && onStarClick ? () => onStarClick(i + 1) : undefined}
        />
      );
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-10">
          <div className="text-center">Loading product...</div>
        </main>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-10">
          <div className="text-center text-red-600 font-semibold">{error || "Product not found."}</div>
          <div className="text-center text-xs text-gray-400 mt-2">Product ID: {params.productId?.toString() || "(none)"}</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <button onClick={() => router.back()} className="mb-4 text-blue-600 underline">&larr; Back to Menu</button>
        <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col md:flex-row gap-8">
          {/* Product Image */}
          <div className="flex-shrink-0 flex items-center justify-center mb-6 md:mb-0">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-48 h-48 object-cover rounded-2xl border" />
            ) : (
              <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded-2xl text-gray-400">No Image</div>
            )}
          </div>
          {/* Product Info */}
          <div className="flex-1 flex flex-col">
            <h1 className="text-3xl font-extrabold text-blue-700 mb-2">{product.name}</h1>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex">{renderStars(Number(averageRating))}</div>
              <span className="text-sm text-gray-600">
                {averageRating} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
              </span>
            </div>
            <div className="mb-2 text-gray-700">{product.description}</div>
            <div className="mb-2">
              {product.tags && product.tags.map(tag => (
                <span key={tag} className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded mr-2 mb-1">{tag}</span>
              ))}
              {product.category && (
                <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded mr-2 mb-1">{product.category}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-4">
              <button
                className="px-3 py-1 bg-gray-200 rounded text-lg"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
              >-</button>
              <span className="w-8 text-center">{quantity}</span>
              <button
                className="px-3 py-1 bg-gray-200 rounded text-lg"
                onClick={() => setQuantity(q => q + 1)}
              >+</button>
            </div>
            <div className="mb-4 text-lg font-bold text-blue-700">₹{product.price}</div>
            {product.benefits && (
              <div className="mb-4">
                <h3 className="font-semibold text-blue-700 mb-1">Benefits</h3>
                <ul className="list-disc ml-6 text-gray-700">
                  {product.benefits.split("\n").map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow hover:bg-blue-700 transition w-full md:w-auto"
              onClick={() => addToCart({ id: product.id, name: product.name, price: product.price, quantity })}
            >
              Add to Cart
            </button>
          </div>
        </div>
        {/* Reviews Section */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-blue-700 mb-6">Customer Reviews</h2>

          {/* Add Review Form */}
          {session?.user && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
              <form onSubmit={handleSubmitReview}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <div className="flex gap-1">
                    {renderStars(newReview.rating, true, (rating) => setNewReview({ ...newReview, rating }))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    rows={3}
                    placeholder="Share your experience with this dish..."
                    required
                  />
                </div>
                {reviewError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {reviewError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reviews yet. Be the first to review this dish!
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {review.profiles?.full_name || "Anonymous"}
                        </span>
                        <div className="flex">{renderStars(review.rating)}</div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
} 