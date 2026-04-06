"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Callback() {
  
  useEffect(() => {
    const handleLogin = async () => {
      try {
        await supabase.auth.exchangeCodeForSession();

        // ✅ ALWAYS SAFE
        window.location.href = "/";
        
      } catch (err) {
        console.error(err);
        window.location.href = "/login";
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
 
