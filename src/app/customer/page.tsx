"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const HERO_BANNERS = [
  {
    img: "/globe.svg",
    title: "Fresh, Fast, Flavorful",
    desc: "Experience cloud kitchen magic—delivered to your door.",
  },
  {
    img: "/window.svg",
    title: "Eat Clean, Feel Great",
    desc: "Wholesome meals for every lifestyle and diet.",
  },
  {
    img: "/file.svg",
    title: "Deliciously Diverse Menu",
    desc: "From vegan to keto, we have something for everyone!",
  },
];

const PRODUCT_CATEGORIES = [
  { name: "Breakfast", img: "/globe.svg" },
  { name: "Lunch", img: "/window.svg" },
  { name: "Snacks", img: "/file.svg" },
  { name: "Dinner", img: "/vercel.svg" },
];

const DIET_CATEGORIES = [
  { name: "Vegan", img: "/globe.svg" },
  { name: "Keto", img: "/window.svg" },
  { name: "Gluten-Free", img: "/file.svg" },
  { name: "High Protein", img: "/vercel.svg" },
];

const REVIEWS = [
  {
    name: "Aarav S.",
    review: "The vegan bowls are so fresh and tasty! Love the quick delivery.",
  },
  {
    name: "Priya M.",
    review: "Finally, healthy keto options that actually taste good!",
  },
  {
    name: "Rahul D.",
    review: "Superb service and the ingredients are top notch.",
  },
];

export default function CustomerHome() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ensureProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error fetching user:", userError);
        return;
      }
      if (!user) {
        console.warn("No user found, skipping profile ensure.");
        return;
      }
      // Check if profile exists
      const { data: profile, error: selectError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();
      if (selectError && selectError.code !== 'PGRST116') {
        // PGRST116 = No rows found, which is fine
        console.error("Error selecting profile:", selectError);
        return;
      }
      if (!profile) {
        console.log("Attempting to insert profile for user:", user.id, user.email);
        const { error: insertError } = await supabase.from("profiles").insert([
          {
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email,
            email: user.email,
            role: "customer"
          }
        ]);
        if (insertError) {
          console.error("Failed to insert profile:", insertError);
        } else {
          console.log("Profile inserted successfully!");
        }
      } else {
        console.log("Profile already exists for user:", user.id);
      }
    };
    ensureProfile();
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, image_url, tags")
        .eq("available", true)
        .limit(6);

      if (error) {
        console.error("Error fetching featured products:", error);
      } else {
        setFeaturedProducts(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/customer/menu?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4">
        {/* Hero Section with 3 banners */}
        <section className="relative bg-gradient-to-br from-blue-100 via-white to-blue-200 rounded-3xl p-10 mb-10 text-center shadow-xl overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {HERO_BANNERS.map((banner, i) => (
              <div key={i} className="flex-1 p-6 flex flex-col items-center justify-center">
                <Image src={banner.img} alt={banner.title} width={80} height={80} className="mb-4" />
                <h2 className="text-2xl font-bold text-blue-700 mb-2">{banner.title}</h2>
                <p className="text-gray-700 mb-2">{banner.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-lg text-gray-700">Order delicious food from our cloud kitchen. Fresh, fast, and delivered to your door.</p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-8 max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for dishes, ingredients, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 pr-4 text-gray-900 bg-white border border-gray-300 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </section>

        {/* Featured Products */}
        <section className="mb-10">
          <h3 className="text-2xl font-bold text-blue-700 mb-6 text-center">Featured Dishes</h3>
          {loading ? (
            <div className="text-center text-gray-600">Loading featured dishes...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/customer/menu/${product.id}`}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="aspect-w-16 aspect-h-9">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-lg text-gray-900 mb-2">{product.name}</h4>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-blue-700">₹{product.price}</span>
                      <div className="flex flex-wrap gap-1">
                        {product.tags?.slice(0, 2).map((tag: string) => (
                          <span key={tag} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="text-center mt-6">
            <Link
              href="/customer/menu"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
            >
              View Full Menu
            </Link>
          </div>
        </section>

        {/* Short Introduction */}
        <section className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold text-blue-700 mb-2">Welcome to Satvify1</h2>
          <p className="text-gray-700 max-w-2xl mx-auto">Satvify1 brings you chef-crafted meals, made with the best ingredients, tailored for your lifestyle. Whether you're vegan, keto, or just hungry, we have something for you!</p>
        </section>

        {/* Product Categories */}
        <section className="mb-10">
          <h3 className="text-2xl font-bold text-blue-700 mb-6 text-center">Product Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {PRODUCT_CATEGORIES.map(cat => (
              <div key={cat.name} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center hover:bg-blue-50 transition">
                <Image src={cat.img} alt={cat.name} width={60} height={60} className="mb-3" />
                <span className="font-semibold text-blue-800">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Shop by Category */}
        <section className="mb-10">
          <h3 className="text-2xl font-bold text-blue-700 mb-6 text-center">Shop by Category</h3>
          <div className="flex flex-wrap justify-center gap-6">
            {PRODUCT_CATEGORIES.map(cat => (
              <Link key={cat.name} href={`/customer/menu?category=${encodeURIComponent(cat.name)}`} className="bg-blue-100 rounded-xl px-6 py-4 font-semibold text-blue-700 hover:bg-blue-200 transition">
                {cat.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Shop by Diet */}
        <section className="mb-10">
          <h3 className="text-2xl font-bold text-blue-700 mb-6 text-center">Shop by Diet</h3>
          <div className="flex flex-wrap justify-center gap-6">
            {DIET_CATEGORIES.map(diet => (
              <Link key={diet.name} href={`/customer/menu?diet=${encodeURIComponent(diet.name)}`} className="bg-green-100 rounded-xl px-6 py-4 font-semibold text-green-700 hover:bg-green-200 transition">
                {diet.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Ingredients Matter */}
        <section className="mb-10 bg-blue-50 rounded-3xl p-8 text-center shadow">
          <h3 className="text-2xl font-bold text-blue-700 mb-4">Ingredients Matter</h3>
          <p className="text-gray-700 max-w-2xl mx-auto mb-4">We believe in using only the best ingredients—locally sourced, organic when possible, and always fresh. Our chefs craft every meal with care, so you can eat with confidence.</p>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <span className="inline-block bg-white rounded-full px-6 py-2 text-blue-700 font-semibold shadow">No Preservatives</span>
            <span className="inline-block bg-white rounded-full px-6 py-2 text-blue-700 font-semibold shadow">Locally Sourced</span>
            <span className="inline-block bg-white rounded-full px-6 py-2 text-blue-700 font-semibold shadow">Chef Crafted</span>
            <span className="inline-block bg-white rounded-full px-6 py-2 text-blue-700 font-semibold shadow">Always Fresh</span>
          </div>
        </section>
      </main>
    </>
  );
} 