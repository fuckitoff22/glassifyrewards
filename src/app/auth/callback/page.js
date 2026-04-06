"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleLogin = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (data?.session) {
        // ✅ USER LOGGED IN
        router.push("/");
      } else {
        // ❌ FAILED
        router.push("/login");
      }
    };

    handleLogin();
  }, []);

  return <p>Logging you in...</p>;
}
