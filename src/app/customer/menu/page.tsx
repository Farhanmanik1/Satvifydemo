"use client";
import Navbar from "@/components/Navbar";
import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/store/cart";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const DIET_TAGS = ["Vegan", "Keto", "Gluten-Free", "High Protein"];
const CATEGORY_TAGS = ["Breakfast", "Lunch", "Snacks", "Dinner"];

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  tags: string[];
  available: boolean;
  category?: string;
}

function MenuPageContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToCart } = useCart();
  // Track quantity for each product
  const [quantities, setQuantities] = useState<{ [id: string]: number }>({});
  const [search, setSearch] = useState("");
  const [selectedDiet, setSelectedDiet] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Set filters from query params on first load or when params change
  useEffect(() => {
    const dietParam = searchParams.get("diet");
    const categoryParam = searchParams.get("category");
    const searchParam = searchParams.get("search");

    if (dietParam && (!selectedDiet || selectedDiet.toLowerCase() !== dietParam.toLowerCase())) {
      setSelectedDiet(dietParam);
    }
    if (categoryParam && (!selectedCategory || selectedCategory.toLowerCase() !== categoryParam.toLowerCase())) {
      setSelectedCategory(categoryParam);
    }
    if (searchParam && search !== searchParam) {
      setSearch(searchParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, tags, available, category")
        .eq("available", true);
      if (error) setError(error.message);
      else setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const handleQuantityChange = (id: string, value: number) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, value) }));
  };

  const handleAddToCart = (product: Product) => {
    const qty = quantities[product.id] || 1;
    for (let i = 0; i < qty; i++) {
      addToCart({ id: product.id, name: product.name, price: product.price });
    }
    setQuantities((prev) => ({ ...prev, [product.id]: 1 })); // reset to 1 after adding
  };

  // Filter products by search, diet, and category
  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.description.toLowerCase().includes(search.toLowerCase());
    const matchesDiet = selectedDiet
      ? product.tags.some(tag => tag.toLowerCase() === selectedDiet.toLowerCase())
      : true;
    const matchesCategory = selectedCategory
      ? (product.category && product.category.toLowerCase() === selectedCategory.toLowerCase())
      : true;
    return matchesSearch && matchesDiet && matchesCategory;
  });

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-blue-700">Menu</h1>
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORY_TAGS.map(tag => (
          <button
            key={tag}
            className={`px-4 py-2 rounded-full border font-semibold transition-all text-sm ${selectedCategory && selectedCategory.toLowerCase() === tag.toLowerCase() ? "bg-blue-700 text-white border-blue-700" : "bg-white text-blue-700 border-blue-300 hover:bg-blue-100"}`}
            onClick={() => setSelectedCategory(selectedCategory && selectedCategory.toLowerCase() === tag.toLowerCase() ? null : tag)}
          >
            {tag}
          </button>
        ))}
        {selectedCategory && (
          <button
            className="ml-2 px-3 py-2 rounded-full bg-gray-200 text-gray-700 border border-gray-300 text-xs font-bold"
            onClick={() => setSelectedCategory(null)}
          >
            Clear
          </button>
        )}
      </div>
      {/* Search and Diet Filter */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
        <input
          type="text"
          placeholder="Search for dishes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-blue-300 rounded-lg px-4 py-2 text-lg focus:ring-2 focus:ring-blue-200"
        />
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          {DIET_TAGS.map(tag => (
            <button
              key={tag}
              className={`px-4 py-2 rounded-full border font-semibold transition-all text-sm ${selectedDiet && selectedDiet.toLowerCase() === tag.toLowerCase() ? "bg-blue-600 text-white border-blue-600" : "bg-white text-blue-700 border-blue-300 hover:bg-blue-100"}`}
              onClick={() => setSelectedDiet(selectedDiet && selectedDiet.toLowerCase() === tag.toLowerCase() ? null : tag)}
            >
              {tag}
            </button>
          ))}
          {selectedDiet && (
            <button
              className="ml-2 px-3 py-2 rounded-full bg-gray-200 text-gray-700 border border-gray-300 text-xs font-bold"
              onClick={() => setSelectedDiet(null)}
            >
              Clear
            </button>
          )}
        </div>
      </div>
      {loading && <p>Loading menu...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredProducts.length === 0 && !loading ? (
          <div className="col-span-full text-center text-gray-500">No products found.</div>
        ) : (
          filteredProducts.map(product => (
            <Link
              key={product.id}
              href={`/customer/menu/${product.id}`}
              className="bg-white rounded-lg shadow p-4 flex flex-col hover:shadow-xl transition cursor-pointer"
              style={{ textDecoration: 'none' }}
            >
              <h2 className="text-lg font-bold text-gray-900 mb-1">{product.name}</h2>
              <p className="text-gray-700 mb-2">{product.description}</p>
              <div className="mb-2">
                {product.tags && product.tags.map(tag => (
                  <span key={tag} className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded mr-2 mb-1">{tag}</span>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between gap-2">
                <span className="text-lg font-semibold text-blue-700">₹{product.price}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}

export default function MenuPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div>Loading menu...</div>}>
        <MenuPageContent />
      </Suspense>
    </>
  );
} 