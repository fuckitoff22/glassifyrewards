"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Callback() {

  useEffect(() => {
    const handleLogin = async () => {
      try {
        // 🔥 exchange code
        await supabase.auth.exchangeCodeForSession();

        // 🔥 force redirect (fixes 404 + routing issues)
        setTimeout(() => {
          window.location.href = "https://glassifyrapp.vercel.app/";
        }, 300);

      } catch (err) {
        console.error("OAuth crash:", err);
        window.location.href = "https://glassifyrapp.vercel.app/login";
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
