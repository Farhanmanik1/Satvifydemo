"use client";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Get session and profile robustly on mount
  useEffect(() => {
    const fetchAndEnsureProfile = async () => {
      setLoading(true);
      setError("");

      // Always get the latest user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError("Not logged in.");
        setLoading(false);
        router.push("/login");
        return;
      }
      setSession({ user: userData.user });

      // Try to fetch the profile
      const { data: profile, error: selectError } = await supabase
        .from("profiles")
        .select("full_name, phone, role")
        .eq("id", userData.user.id)
        .single();

      if (selectError && selectError.code !== "PGRST116") {
        // Not a "no rows found" error
        setError("Failed to fetch profile.");
        console.error("Profile fetch error:", selectError);
        setLoading(false);
        return;
      }

      if (!profile) {
        // Try to insert the profile if missing
        const { error: insertError } = await supabase.from("profiles").insert([
          {
            id: userData.user.id,
            full_name: userData.user.user_metadata?.full_name || userData.user.email,
            phone: "",
            role: "customer"
          }
        ]);
        if (insertError) {
          setError("Failed to create profile.");
          console.error("Profile insert error:", insertError);
          setLoading(false);
          return;
        }
        // Fetch again after insert
        const { data: newProfile, error: newSelectError } = await supabase
          .from("profiles")
          .select("full_name, phone, role")
          .eq("id", userData.user.id)
          .single();
        if (newSelectError) {
          setError("Failed to fetch profile after insert.");
          console.error("Profile fetch after insert error:", newSelectError);
          setLoading(false);
          return;
        }
        setProfile(newProfile);
        setName(newProfile.full_name || "");
        setPhone(newProfile.phone || "");
        setLoading(false);
        return;
      }

      setProfile(profile);
      setName(profile.full_name || "");
      setPhone(profile.phone || "");
      setLoading(false);
    };

    fetchAndEnsureProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    setSaving(true);
    setError("");
    setSuccess("");
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name, phone })
      .eq("id", session.user.id);
    setSaving(false);
    if (error) {
      setError("Failed to update profile.");
    } else {
      setSuccess("Profile updated successfully.");
      setProfile((p: any) => ({ ...p, full_name: name, phone }));
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Your Profile</h1>
        {loading ? (
          <div className="text-gray-700">Loading profile...</div>
        ) : error ? (
          <div className="text-red-600 font-semibold">{error}</div>
        ) : (
          <>
            <form className="bg-white p-6 rounded shadow" onSubmit={handleSave}>
              <div className="mb-4">
                <label className="block font-semibold mb-1 text-gray-900">Email</label>
                <input
                  type="email"
                  className="w-full border rounded p-2 text-gray-900 bg-gray-100 cursor-not-allowed"
                  value={session?.user?.email || ""}
                  disabled
                />
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1 text-gray-900">Full Name</label>
                <input
                  type="text"
                  className="w-full border rounded p-2 text-gray-900"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1 text-gray-900">Phone</label>
                <input
                  type="tel"
                  className="w-full border rounded p-2 text-gray-900"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  pattern="[6-9]{1}[0-9]{9}"
                  maxLength={10}
                  minLength={10}
                />
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1 text-gray-900">Role</label>
                <input
                  type="text"
                  className="w-full border rounded p-2 text-gray-900 bg-gray-100 cursor-not-allowed"
                  value={profile?.role || ""}
                  disabled
                />
              </div>
              {success && <div className="text-green-700 mb-2 font-semibold">{success}</div>}
              {error && <div className="text-red-600 mb-2 font-semibold">{error}</div>}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>

            <div className="mt-8 text-center">
              <Link
                href="/customer/feedback"
                className="inline-flex items-center justify-center gap-2 w-full bg-gray-200 text-gray-800 py-3 px-4 rounded font-semibold hover:bg-gray-300 transition"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                Customer Feedback and Support
              </Link>
            </div>
          </>
        )}
      </main>
    </>
  );
}
