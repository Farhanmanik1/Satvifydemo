"use client";
import { useEffect } from 'react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '@/lib/supabaseClient';

export default function ClientSessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const ensureProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error fetching user:", userError);
        return;
      }
      if (!user) return;
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
  }, []);
  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  );
} 