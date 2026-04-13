"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const router = useRouter();

  const [allowed, setAllowed] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);

  // 🔐 PROTECT ROUTE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("key");

    if (key !== process.env.NEXT_PUBLIC_ADMIN_KEY) {
      router.push("/");
    } else {
      setAllowed(true);
      loadData();
    }
  }, []);

  // 📦 LOAD DATA
  const loadData = async () => {
    // submissions from DB
    const { data, error } = await supabase
  .from("submissions")
  .select("*")
  .order("created_at", { ascending: false });

console.log("ADMIN DATA:", data);
    if (data) setSubmissions(data);

    // withdrawals from localStorage
    const w = JSON.parse(localStorage.getItem("gr_withdrawals") || "[]");
    setWithdrawals(w);
  };

  // ✅ APPROVE TASK
  const approveTask = async (item) => {
    // update status
    await supabase
      .from("submissions")
      .update({ status: "approved" })
      .eq("id", item.id);

    // 💰 ADD WALLET
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", item.user_id)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          wallet: (profile.wallet || 0) + 50 // 🔥 you can dynamic later
        })
        .eq("id", item.user_id);
    }

    alert("Approved + Reward added ✅");
    loadData();
  };

  // ❌ REJECT TASK
  const rejectTask = async (item) => {
    await supabase
      .from("submissions")
      .update({ status: "rejected" })
      .eq("id", item.id);

    alert("Rejected ❌");
    loadData();
  };

  // 💸 WITHDRAW APPROVE
  const approveWithdraw = (i) => {
    const updated = [...withdrawals];
    updated[i].status = "approved";

    localStorage.setItem("gr_withdrawals", JSON.stringify(updated));
    setWithdrawals(updated);
  };

  // ❌ WITHDRAW REJECT
  const rejectWithdraw = (i) => {
    const updated = [...withdrawals];
    updated[i].status = "rejected";

    localStorage.setItem("gr_withdrawals", JSON.stringify(updated));
    setWithdrawals(updated);
  };

  if (!allowed) return null;

  return (
    <div className="p-5 space-y-6">

      <h1 className="text-xl font-bold">Admin Panel</h1>

      {/* 🧾 SUBMISSIONS */}
      <div>
        <h2 className="font-semibold mb-2">Submissions</h2>

        {submissions.map((s) => (
          <Card key={s.id} className="mb-3">
            <CardContent className="p-3 space-y-2">

              <p><b>User:</b> {s.user_id}</p>
              <p><b>Task:</b> {s.task_name}</p>
              <p><b>Status:</b> {s.status}</p>

              <img src={s.image_url} className="w-40 rounded" />

              <div className="flex gap-2">
                <Button onClick={() => approveTask(s)}>Approve</Button>
                <Button onClick={() => rejectTask(s)} variant="destructive">
                  Reject
                </Button>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>

      {/* 💸 WITHDRAWALS */}
      <div>
        <h2 className="font-semibold mb-2">Withdrawals</h2>

        {withdrawals.map((w, i) => (
          <Card key={i} className="mb-3">
            <CardContent className="p-3 space-y-2">

              <p><b>Amount:</b> ₹{w.amount}</p>
              <p><b>Status:</b> {w.status}</p>

              <div className="flex gap-2">
                <Button onClick={() => approveWithdraw(i)}>Approve</Button>
                <Button onClick={() => rejectWithdraw(i)} variant="destructive">
                  Reject
                </Button>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}
