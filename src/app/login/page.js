"use client";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {

  const googleLogin = async () => {
    await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: "https://glassifyrapp.vercel.app/auth/callback"
  }
});

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">

      <div className="w-[360px] p-6 rounded-2xl bg-blue-100/40 backdrop-blur-xl border border-blue-200 shadow-xl text-center">

        <h2 className="text-xl font-semibold mb-6">
          Continue with Google
        </h2>

        <button
          onClick={googleLogin}
          className="w-full py-3 rounded-full bg-white shadow hover:scale-105 transition flex items-center justify-center gap-3"
        >
          <img
            src="https://cdn-icons-png.flaticon.com/512/281/281764.png"
            className="w-5 h-5"
          />
          Continue with Google
        </button>

      </div>

    </div>
  );
}
