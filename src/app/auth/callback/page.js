"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      const user = session?.user;

      if (user) {
        // ✅ CREATE USER IN DB
        const { error } = await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            email: user.email,
            wallet: 0
          });

        if (error) {
          console.log("PROFILE CREATE ERROR:", error.message);
        }
      }

      // ✅ redirect to main app
      router.replace("/");
    };

    handleAuth();
  }, []);

  return (
    <div className="h-screen flex items-center justify-center">
      Logging you in...
    </div>
  );
}
