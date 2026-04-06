"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    const handleLogin = async () => {
      try {
        // 🔥 exchange code (important)
        await supabase.auth.exchangeCodeForSession();

        // 🔥 DO NOT CHECK SESSION HERE
        // just redirect to home
        setTimeout(() => {
          router.replace("/");
        }, 300); // small delay ensures session is ready

      } catch (err) {
        console.error("OAuth crash:", err);
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
