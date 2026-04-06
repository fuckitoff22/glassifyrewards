"use client";

import { supabase } from "@/lib/supabase";

export default function LoginPage() {

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://glassifyrapp.vercel.app/auth/callback"
      }
    });
  };

  return (
    <div className="h-screen flex items-center justify-center bg-white">

      <div className="backdrop-blur-lg bg-white/70 border border-gray-200 rounded-2xl shadow-xl p-8 w-[350px] text-center transition hover:shadow-2xl">

        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          Login
        </h2>

        <button
          onClick={handleLogin}
          className="w-full py-3 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
        >
          Continue with Google
        </button>

      </div>
    </div>
  );
}
