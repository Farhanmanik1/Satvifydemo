"use client";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/store/cart";

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
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);

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
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("id, product_id, user_id, rating, comment, created_at")
        .eq("product_id", product.id);
      if (!error && data) setReviews(data);
    };
    fetchReviews();
  }, [product]);

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
          <h2 className="text-xl font-bold text-blue-700 mb-4">Customer Reviews</h2>
          {reviews.length === 0 ? (
            <div className="text-gray-500">No reviews yet.</div>
          ) : (
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="font-bold text-blue-700 mb-1">{r.rating}★</div>
                  <div className="text-gray-800 mb-1">{r.comment}</div>
                  <div className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
} 