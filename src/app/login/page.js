"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");

  const login = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) alert(error.message);
    else alert("Check your email 📩");
  };

  const googleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const facebookLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: "facebook" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">

      {/* 🌄 BACKGROUND */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501785888041-af3ef285b470')] bg-cover bg-center"></div>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      {/* 🔥 GLASS CARD */}
      <div className="relative w-[350px] p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">

        {/* TITLE */}
        <h2 className="text-center text-xl font-semibold text-white mb-6">
          Login
        </h2>

        {/* EMAIL INPUT */}
        <input
          placeholder="Enter Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full mb-4 p-3 rounded-full bg-white/20 text-white placeholder-white/70 outline-none border border-white/30 focus:ring-2 focus:ring-blue-400 transition"
        />

        {/* LOGIN BUTTON */}
        <button
          onClick={login}
          className="w-full py-2 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition"
        >
          Continue
        </button>

        {/* DIVIDER */}
        <p className="text-center text-white/70 text-sm my-4">
          Don’t have an account?
        </p>

        {/* SOCIAL LOGIN */}
        <div className="flex justify-center gap-4">

          {/* GOOGLE */}
          <button
            onClick={googleLogin}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition border border-white/30"
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/281/281764.png"
              className="w-5 h-5"
            />
          </button>

          {/* FACEBOOK */}
          <button
            onClick={facebookLogin}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition border border-white/30"
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/733/733547.png"
              className="w-5 h-5"
            />
          </button>

        </div>

      </div>
    </div>
  );
}
