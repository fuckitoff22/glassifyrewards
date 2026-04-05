"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const signup = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) alert(error.message);
    else alert("Check your email to continue 📩");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">

      <div className="w-[360px] p-6 rounded-2xl bg-blue-100/40 backdrop-blur-xl border border-blue-200 shadow-xl">

        <h2 className="text-center text-xl font-semibold mb-5 text-gray-800">
          Sign Up
        </h2>

        <input
          placeholder="Enter Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full mb-4 p-3 rounded-full bg-white/70 border border-gray-300 outline-none focus:ring-2 focus:ring-blue-400"
        />

        <button
          onClick={signup}
          className="w-full py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
        >
          Continue
        </button>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <span
            onClick={() => router.push("/login")}
            className="text-blue-600 cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>

      </div>
    </div>
  );
}
