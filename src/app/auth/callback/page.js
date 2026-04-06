"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    const handleLogin = async () => {
      try {
        // 🔥 THIS IS THE FIX
        const { data, error } = await supabase.auth.exchangeCodeForSession();

        if (error) {
          console.error("OAuth error:", error);
          router.replace("/login");
          return;
        }

        if (data?.session) {
          router.replace("/"); // ✅ success
        } else {
          router.replace("/login");
        }

      } catch (err) {
        console.error("Crash:", err);
        router.replace("/login");
      }
    };

    handleLogin();
  }, []);

  return (
    <div className="h-screen flex items-center justify-center">
      Logging you in...
    </div>
  );
}
