"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function AdminPanel() {
  const [page, setPage] = useState("dashboard");
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [suspendModal, setSuspendModal] = useState({ open:false, user:null, hours:"" });

  const [form, setForm] = useState({ title:"", link:"", reward:"", type:"normal", subtype:"", logo:null });

  // ================= LOAD =================
  const load = async () => {
    const { data: t } = await supabase.from("tasks").select("*");
    const { data: s } = await supabase.from("submissions").select("*");
    const { data: u } = await supabase.from("profiles").select("*");
    const { data: w } = await supabase.from("withdrawals").select("*");

    setTasks(t || []);
    setSubmissions(s || []);
    setUsers(u || []);
    setWithdrawals(w || []);
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 2000);
    return () => clearInterval(i);
  }, []);

  // ================= TASK =================
  const saveTask = async () => {
    if (!form.title) return;

    if (editingId) {
      await supabase
        .from("tasks")
        .update({ ...form, reward:Number(form.reward) })
        .eq("id", editingId);

      setEditingId(null);
    } else {
      await supabase.from("tasks").insert([
        { id: Date.now(), ...form, reward:Number(form.reward) }
      ]);
    }

    setForm({ title:"", link:"", reward:"", type:"normal", subtype:"", logo:null });
    load();
  };

  const editTask = (t) => {
    setForm(t);
    setEditingId(t.id);
    setPage("create");
  };

  const deleteTask = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
    load();
  };

  // ================= SUBMISSION =================
  const handleSubmission = async (id, status) => {
    const { data: sub } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", id)
      .single();

    if (status === "approved") {
      const { data: user } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", sub.user)
        .single();

      await supabase
        .from("profiles")
        .update({ wallet: (user.wallet || 0) + (sub.task?.reward || 0) })
        .eq("email", sub.user);
    }

    await supabase
      .from("submissions")
      .update({ status })
      .eq("id", id);

    load();
  };

  // ================= WITHDRAW =================
  const handleWithdraw = async (id, status) => {
    const { data: req } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("id", id)
      .single();

    if (status === "rejected") {
      const { data: user } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", req.user)
        .single();

      await supabase
        .from("profiles")
        .update({ wallet: (user.wallet || 0) + req.amount })
        .eq("email", req.user);
    }

    await supabase
      .from("withdrawals")
      .update({ status })
      .eq("id", id);

    load();
  };

  const ecommerceTasks = tasks.filter(t=>t.subtype==="ecommerce");
  const otherTasks = tasks.filter(t=>t.subtype!=="ecommerce");

  return (
    <div className="min-h-screen p-4 bg-white text-black">

      <div className="flex gap-2 mb-6 flex-wrap">
        <Button onClick={()=>setPage("dashboard")}>Dashboard</Button>
        <Button onClick={()=>setPage("create")}>Create Task</Button>
        <Button onClick={()=>setPage("manage-ecom")}>Ecommerce Tasks</Button>
        <Button onClick={()=>setPage("manage-other")}>Other Tasks</Button>
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

      {/* CREATE TASK */}
      {page==="create" && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6 space-y-3">
            <input className="w-full p-3 border" placeholder="Task Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
            <input className="w-full p-3 border" placeholder="Task Link" value={form.link} onChange={e=>setForm({...form,link:e.target.value})} />
            <input className="w-full p-3 border" placeholder="Reward" value={form.reward} onChange={e=>setForm({...form,reward:e.target.value})} />

            <select className="w-full p-3 border" value={form.type} onChange={e=>setForm({...form,type:e.target.value,subtype:e.target.value==="affiliate"?"ecommerce":""})}>
              <option value="normal">Normal</option>
              <option value="affiliate">Affiliate</option>
            </select>

            {form.type==="affiliate" && (
              <select className="w-full p-3 border" value={form.subtype} onChange={e=>setForm({...form,subtype:e.target.value})}>
                <option value="ecommerce">Ecommerce</option>
                <option value="general">General</option>
              </select>
            )}

            <Button onClick={saveTask} className="w-full">
              {editingId ? "Update Task" : "Create Task"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* PAYOFF */}
      {page==="payoff" && (
        <Card>
          <CardContent className="p-4">
            {withdrawals.map(w=> (
              <div key={w.id} className="border p-3 mb-2">
                <p>{w.user}</p>
                <p>₹{w.amount}</p>
                <p>{w.status}</p>
                {w.status==="pending" && (
                  <div className="flex gap-2 mt-2">
                    <Button onClick={()=>handleWithdraw(w.id,"approved")}>Approve</Button>
                    <Button onClick={()=>handleWithdraw(w.id,"rejected")}>Reject</Button>
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
