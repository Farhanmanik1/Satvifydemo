"use client";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  priority: string;
}

const TICKET_CATEGORIES = [
  { value: "order", label: "Order Issues" },
  { value: "delivery", label: "Delivery Issues" },
  { value: "food_quality", label: "Food Quality" },
  { value: "payment", label: "Payment Issues" },
  { value: "refund", label: "Refund Request" },
  { value: "general", label: "General Inquiry" },
];

const PRIORITY_LEVELS = [
  { value: "low", label: "Low", color: "text-green-600 bg-green-100" },
  { value: "medium", label: "Medium", color: "text-yellow-600 bg-yellow-100" },
  { value: "high", label: "High", color: "text-red-600 bg-red-100" },
];

const STATUS_COLORS = {
  open: "text-blue-600 bg-blue-100",
  assigned: "text-purple-600 bg-purple-100",
  "in-progress": "text-orange-600 bg-orange-100",
  resolved: "text-green-600 bg-green-100",
  closed: "text-gray-600 bg-gray-100",
};

export default function CustomerSupportPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-yellow-100 text-yellow-800 p-6 rounded shadow text-center font-semibold">
          Support ticket system is disabled.
        </div>
      </main>
    </>
  );
}
