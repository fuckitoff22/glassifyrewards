"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      console.log("CALLBACK START");

      // wait for session to be ready
      await new Promise((res) => setTimeout(res, 1000));

      const { data: { session } } = await supabase.auth.getSession();

      console.log("SESSION:", session);

      const user = session?.user;

      if (user) {
        const { error } = await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            email: user.email,
            wallet: 0,
          });

        console.log("UPSERT RESULT:", error);
      } else {
        console.log("NO USER FOUND ❌");
      }

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
