"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CustomerFeedbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new support page
    router.replace("/customer/support");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to Support...</p>
      </div>
    </div>
  );
}
