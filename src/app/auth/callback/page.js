"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    const handleLogin = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error(error);
        router.replace("/login");
        return;
      }

      if (data?.session) {
        // ✅ SUCCESS LOGIN
        router.replace("/");
      } else {
        // ❌ FAILED LOGIN
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
