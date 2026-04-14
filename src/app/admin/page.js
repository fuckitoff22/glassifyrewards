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

  const [form, setForm] = useState({
    title: "",
    link: "",
    reward: "",
    type: "normal",
    subtype: "",
    logo: null
  });

  // 🔐 ADMIN KEY
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("key");
    if (!key || key !== process.env.NEXT_PUBLIC_ADMIN_KEY) {
      document.body.innerHTML = "Not authorized";
    }
  }, []);

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
  }, []);

  // ================= TASK =================
 const saveTask = async () => {
  if (!form.title) return alert("Title required");

  const { error } = await supabase.from("tasks").insert([{
    ...form,
    reward: Number(form.reward)
  }]);

  console.log("TASK ERROR:", error);

  if (error) {
    alert("Task failed ❌");
    return;
  }

  alert("Task created ✅");

  setForm({
    title: "",
    link: "",
    reward: "",
    type: "normal",
    subtype: "",
    logo: null
  });

  load();
};

  // ================= SUBMISSIONS =================
  const handleSubmission = async (id, status) => {
    const { data: sub } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", id)
      .single();

    if (!sub) return;

    // ✅ APPROVE → ADD MONEY
    if (status === "approved") {
      const { data: task } = await supabase
        .from("tasks")
        .select("reward")
        .eq("title", sub.task_name)
        .single();

      const { data: user } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sub.user_id)
        .single();

      if (user) {
        await supabase
          .from("profiles")
          .update({
            wallet: (user.wallet || 0) + (task?.reward || 0)
          })
          .eq("id", sub.user_id);
      }
    }

    // ❌ REJECT → cooldown
    if (status === "rejected") {
      const cooldownTime = new Date(Date.now() + 30 * 60 * 1000);

      await supabase
        .from("profiles")
        .update({
          cooldown_until: cooldownTime.toISOString()
        })
        .eq("id", sub.user_id);
    }

    // 🗑 DELETE SUBMISSION (SS removed automatically)
    await supabase.from("submissions").delete().eq("id", id);

    load();
  };

  return (
    <div className="min-h-screen p-4 bg-white text-black">

      {/* NAV */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Button onClick={() => setPage("dashboard")}>Dashboard</Button>
        <Button onClick={() => setPage("create")}>Create Task</Button>
        <Button onClick={() => setPage("manage-ecom")}>Ecommerce</Button>
        <Button onClick={() => setPage("manage-other")}>Other Tasks</Button>
        <Button onClick={() => setPage("users")}>Users</Button>
        <Button onClick={() => setPage("submissions")}>Submissions</Button>
        <Button onClick={() => setPage("payoff")}>Withdrawals</Button>
      </div>

      {/* DASHBOARD */}
      {page === "dashboard" && (
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4">Users: {users.length}</CardContent></Card>
          <Card><CardContent className="p-4">Submissions: {submissions.length}</CardContent></Card>
          <Card><CardContent className="p-4">Withdrawals: {withdrawals.length}</CardContent></Card>
        </div>
      )}

      {/* CREATE TASK */}
     {page === "create" && (
  <Card className="max-w-2xl mx-auto">
    <CardContent className="p-6 space-y-3">

      <input
        placeholder="Title"
        value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
      />

      <input
        placeholder="Link"
        value={form.link}
        onChange={e => setForm({ ...form, link: e.target.value })}
      />

      <input
        placeholder="Reward"
        value={form.reward}
        onChange={e => setForm({ ...form, reward: e.target.value })}
      />

      {/* TYPE SELECT */}
      <select
        value={form.type}
        onChange={(e) => {
          const value = e.target.value;
          setForm({
            ...form,
            type: value,
            subtype: value === "affiliate" ? "ecommerce" : ""
          });
        }}
      >
        <option value="normal">Normal</option>
        <option value="affiliate">Affiliate</option>
      </select>

      {/* SUBTYPE SELECT */}
      {form.type === "affiliate" && (
        <select
          value={form.subtype}
          onChange={(e) =>
            setForm({ ...form, subtype: e.target.value })
          }
        >
          <option value="ecommerce">Ecommerce</option>
          <option value="general">General</option>
        </select>
      )}

      {/* FILE UPLOAD */}
      {form.type === "affiliate" && form.subtype === "ecommerce" && (
        <input
          type="file"
          onChange={(e) => {
            const reader = new FileReader();
            reader.onload = () =>
              setForm(prev => ({ ...prev, logo: reader.result }));
            reader.readAsDataURL(e.target.files[0]);
          }}
        />
      )}

      <Button onClick={saveTask}>
        {editingId ? "Update" : "Create"}
      </Button>

    </CardContent>
  </Card>
)}

      {/* USERS */}
     {page === "users" && (
  <div className="grid gap-3">
    {users.map(u => (
      <Card key={u.id}>
        <CardContent className="p-3 space-y-2">

          <p>{u.email}</p>
          <p>Wallet: ₹{u.wallet || 0}</p>

          {/* ADD BALANCE */}
          <Button onClick={async () => {
            const amt = prompt("Enter amount");
            if (!amt) return;

            await supabase
              .from("profiles")
              .update({
                wallet: (u.wallet || 0) + Number(amt)
              })
              .eq("id", u.id);

            load();
          }}>
            Add Balance
          </Button>

          {/* BAN */}
          <Button onClick={async () => {
            await supabase
              .from("profiles")
              .update({
                is_banned: !u.is_banned
              })
              .eq("id", u.id);

            load();
          }}>
            {u.is_banned ? "Unban" : "Ban"}
          </Button>

          {/* SUSPEND WITH TIMER */}
          <Button onClick={async () => {
            const mins = prompt("Suspend minutes?");
            if (!mins) return;

            const until = new Date(Date.now() + mins * 60000);

            await supabase
              .from("profiles")
              .update({
                suspended_until: until.toISOString()
              })
              .eq("id", u.id);

            load();
          }}>
            Suspend
          </Button>

          {/* UNSUSPEND */}
          <Button onClick={async () => {
            await supabase
              .from("profiles")
              .update({
                suspended_until: null
              })
              .eq("id", u.id);

            load();
          }}>
            Unsuspend
          </Button>

        </CardContent>
      </Card>
    ))}
  </div>
)}
      {/* SUBMISSIONS */}
      {page === "submissions" && (
        <div className="grid gap-3">
          {submissions.map(s => (
            <Card key={s.id}>
              <CardContent className="p-3">
                <p>User ID: {s.user_id}</p>
                <p>Task: {s.task_name}</p>

                {s.image_url && (
                  <a href={s.image_url} target="_blank">View SS</a>
                )}

                <p>{s.status}</p>

                <Button onClick={() => handleSubmission(s.id, "approved")}>
                  Approve
                </Button>

                <Button onClick={() => handleSubmission(s.id, "rejected")}>
                  Reject
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* WITHDRAW */}
      {page === "payoff" && (
        <div className="grid gap-3">
          {withdrawals.map(w => (
            <Card key={w.id}>
              <CardContent className="p-3">
                <p>User ID: {w.user_id}</p>
                <p>₹{w.amount}</p>
                <p>{w.status}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}
{/* ECOMMERCE */}
{page === "manage-ecom" && (
  <div className="grid gap-3">
    {tasks.filter(t => t.subtype === "ecommerce").map(t => (
      <Card key={t.id}>
        <CardContent className="p-3">

          <p>{t.title}</p>
          {t.logo && <img src={t.logo} className="w-12" />}

          <Button onClick={() => {
            setForm(t);
            setEditingId(t.id);
            setPage("create");
          }}>Edit</Button>

          <Button onClick={async () => {
            await supabase.from("tasks").delete().eq("id", t.id);
            load();
          }}>Delete</Button>

        </CardContent>
      </Card>
    ))}
  </div>
)}

{/* OTHER TASKS */}
{page === "manage-other" && (
  <div className="grid gap-3">
    {tasks.filter(t => t.subtype !== "ecommerce").map(t => (
      <Card key={t.id}>
        <CardContent className="p-3">

          <p>{t.title}</p>

          <Button onClick={() => {
            setForm(t);
            setEditingId(t.id);
            setPage("create");
          }}>Edit</Button>

          <Button onClick={async () => {
            await supabase.from("tasks").delete().eq("id", t.id);
            load();
          }}>Delete</Button>

        </CardContent>
      </Card>
    ))}
  </div>
)}
