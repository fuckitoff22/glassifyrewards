"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient"; // ✅ ADD THIS
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminPanel() {
  const [page, setPage] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);

  // ✅ LOAD DATA FROM SUPABASE
  const loadData = async () => {
    const { data: usersData } = await supabase.from("profiles").select("*");
    const { data: subData } = await supabase.from("submissions").select("*");
    const { data: wData } = await supabase.from("withdrawals").select("*");

    setUsers(usersData || []);
    setSubmissions(subData || []);
    setWithdrawals(wData || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ✅ WALLET UPDATE
  const updateWallet = async (userId) => {
    const amount = prompt("Enter new wallet amount");
    if (!amount) return;

    await supabase
      .from("profiles")
      .update({ wallet: Number(amount) })
      .eq("id", userId);

    loadData();
  };

  // ✅ BAN USER
  const banUser = async (userId) => {
    const hours = prompt("Ban for how many hours?");
    if (!hours) return;

    await supabase
      .from("profiles")
      .update({
        status: "banned",
        ban_until: Date.now() + hours * 60 * 60 * 1000,
      })
      .eq("id", userId);

    loadData();
  };

  // ✅ SUSPEND USER
  const suspendUser = async (userId) => {
    const hours = prompt("Suspend for how many hours?");
    if (!hours) return;

    await supabase
      .from("profiles")
      .update({
        status: "suspended",
        suspend_until: Date.now() + hours * 60 * 60 * 1000,
      })
      .eq("id", userId);

    loadData();
  };

  const unsuspendUser = async (userId) => {
    await supabase
      .from("profiles")
      .update({ status: "active" })
      .eq("id", userId);

    loadData();
  };

  // ✅ HANDLE SUBMISSIONS
  const handleSubmission = async (sub, status) => {
    if (status === "approved") {
      // add reward
      const { data: user } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sub.user_id)
        .single();

      await supabase
        .from("profiles")
        .update({ wallet: user.wallet + sub.reward })
        .eq("id", sub.user_id);
    }

    await supabase
      .from("submissions")
      .update({ status })
      .eq("id", sub.id);

    loadData();
  };

  // ✅ HANDLE WITHDRAWALS
  const handleWithdraw = async (w, status) => {
    if (status === "approved") {
      const { data: user } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", w.user_id)
        .single();

      await supabase
        .from("profiles")
        .update({ wallet: user.wallet - w.amount })
        .eq("id", w.user_id);
    }

    await supabase
      .from("withdrawals")
      .update({ status })
      .eq("id", w.id);

    loadData();
  };

  return (
    <div className="min-h-screen p-4 bg-white text-black">

      <div className="flex gap-2 mb-6 flex-wrap">
        <Button onClick={()=>setPage("dashboard")}>Dashboard</Button>
        <Button onClick={()=>setPage("users")}>Users</Button>
        <Button onClick={()=>setPage("submissions")}>Submissions</Button>
        <Button onClick={()=>setPage("payoff")}>Payoff</Button>
      </div>

      {/* DASHBOARD */}
      {page==="dashboard" && (
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4">Approved: {submissions.filter(s=>s.status==="approved").length}</CardContent></Card>
          <Card><CardContent className="p-4">Rejected: {submissions.filter(s=>s.status==="rejected").length}</CardContent></Card>
          <Card><CardContent className="p-4">Users: {users.length}</CardContent></Card>
        </div>
      )}

      {/* USERS */}
      {page==="users" && (
        <Card>
          <CardContent className="p-4">
            {users.map(u=> (
              <div key={u.id} className="border p-3 mb-3">
                <p className="font-semibold">{u.email}</p>
                <p>Wallet: ₹{u.wallet}</p>
                <p>Status: {u.status || "active"}</p>

                <div className="flex gap-2 mt-2 flex-wrap">
                  <Button onClick={()=>updateWallet(u.id)}>Edit Wallet</Button>
                  <Button onClick={()=>banUser(u.id)}>Ban</Button>

                  {u.status === "suspended" ? (
                    <Button onClick={()=>unsuspendUser(u.id)}>Unsuspend</Button>
                  ) : (
                    <Button onClick={()=>suspendUser(u.id)}>Suspend</Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* SUBMISSIONS */}
      {page==="submissions" && (
        <div className="grid gap-3">
          {submissions.filter(s=>s.status==="pending").map(s=> (
            <Card key={s.id}><CardContent className="p-3">
              <p className="font-semibold">{s.task_title}</p>
              {s.img && <a href={s.img} target="_blank">View Screenshot</a>}
              <p>₹{s.reward}</p>
              <div className="flex gap-2 mt-2">
                <Button onClick={()=>handleSubmission(s,"approved")} className="flex-1">Approve</Button>
                <Button onClick={()=>handleSubmission(s,"rejected")} className="flex-1">Reject</Button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}

      {/* PAYOFF */}
      {page==="payoff" && (
        <Card>
          <CardContent className="p-4">
            {withdrawals.map(w=> (
              <div key={w.id} className="border p-3 mb-2">
                <p>Amount: ₹{w.amount}</p>
                <p>Status: {w.status}</p>
                {w.status==="pending" && (
                  <div className="flex gap-2 mt-2">
                    <Button onClick={()=>handleWithdraw(w,"approved")}>Approve</Button>
                    <Button onClick={()=>handleWithdraw(w,"rejected")}>Reject</Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
