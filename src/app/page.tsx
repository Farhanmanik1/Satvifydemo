"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to customer home page
    router.replace("/customer");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-blue-700 mb-4">Welcome to Satvify1</h1>
        <p className="text-gray-600">Redirecting to customer portal...</p>
      </div>
    </div>
  );
}
