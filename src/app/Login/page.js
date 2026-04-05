"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");

  // 🔥 EMAIL LOGIN (OTP)
  const handleEmailLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Check your email for login link 📩");
    }
  };

  // 🔥 GOOGLE LOGIN
  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  // 🔥 FACEBOOK LOGIN
  const handleFacebook = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "facebook",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200">

      {/* 🔥 GLASS CONTAINER */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.4 }}
        className="w-[350px] p-6 rounded-2xl backdrop-blur-xl bg-white/40 border border-white/30 shadow-[0_10px_40px_rgba(0,0,0,0.2)]"
      >

        <h2 className="text-xl font-bold text-center mb-4">
          Welcome to Glassify
        </h2>

        {/* EMAIL INPUT */}
        <input
          placeholder="Enter your email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full p-2 rounded bg-white/60 border border-white/40 mb-3 outline-none"
        />

        {/* EMAIL BUTTON */}
        <button
          onClick={handleEmailLogin}
          className="w-full py-2 mb-3 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
        >
          Continue with Email
        </button>

        <div className="text-center text-sm mb-2 text-gray-600">
          OR
        </div>

        {/* GOOGLE */}
        <button
          onClick={handleGoogle}
          className="w-full py-2 mb-2 rounded bg-white border hover:bg-gray-100 transition"
        >
          Continue with Google
        </button>

        {/* FACEBOOK */}
        <button
          onClick={handleFacebook}
          className="w-full py-2 rounded bg-blue-700 text-white hover:bg-blue-800 transition"
        >
          Continue with Facebook
        </button>

        <p className="text-xs text-center mt-4 text-gray-500">
          Secure login powered by Supabase
        </p>

      </motion.div>
    </div>
  );
}
