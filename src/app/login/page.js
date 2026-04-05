"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const router = useRouter();

  const login = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email });
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
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">

      {/* 🔥 CURSOR SHADOW EFFECT */}
      <div
        className="pointer-events-none fixed w-72 h-72 rounded-full bg-blue-400/20 blur-3xl transition-all duration-200"
        style={{
          left: pos.x - 150,
          top: pos.y - 150
        }}
      />

      {/* 🔥 GLASS CARD */}
      <div
        onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
        className="relative w-[360px] p-6 rounded-2xl bg-blue-100/40 backdrop-blur-xl border border-blue-200 shadow-xl transition duration-300 hover:scale-[1.03] hover:shadow-[0_20px_60px_rgba(0,0,255,0.25)]"
      >

        {/* TITLE */}
        <h2 className="text-center text-xl font-semibold mb-5 text-gray-800">
          Login
        </h2>

        {/* EMAIL */}
        <input
          placeholder="Enter Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full mb-4 p-3 rounded-full bg-white/70 border border-gray-300 outline-none focus:ring-2 focus:ring-blue-400 transition"
        />

        {/* LOGIN BUTTON */}
        <button
          onClick={login}
          className="w-full py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
        >
          Continue
        </button>

        {/* SIGN UP LINK */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Don’t have an account?{" "}
          <span
            onClick={() => router.push("/signup")}
            className="text-blue-600 cursor-pointer hover:underline"
          >
            Sign up
          </span>
        </p>

        {/* SOCIAL LOGIN */}
        <div className="flex justify-center gap-4 mt-4">

          {/* GOOGLE */}
          <button
            onClick={googleLogin}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow hover:scale-110 transition"
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/281/281764.png"
              className="w-5 h-5"
            />
          </button>

          {/* FACEBOOK */}
          <button
            onClick={facebookLogin}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow hover:scale-110 transition"
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
