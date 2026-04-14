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
    if (!form.title) return;

    if (editingId) {
      await supabase
        .from("tasks")
        .update({
          ...form,
          reward: Number(form.reward)
        })
        .eq("id", editingId);
      setEditingId(null);
    } else {
      await supabase.from("tasks").insert([
        {
          ...form,
          reward: Number(form.reward)
        }
      ]);
    }

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

  const deleteTask = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
    load();
  };

  {/* USERS */}
{page === "users" && (
  <div className="grid gap-3">
    {users.map((u) => (
      <Card key={u.id}>
        <CardContent className="p-3 space-y-2">

          <p><b>Email:</b> {u.email}</p>
          <p><b>User ID:</b> {u.id}</p>
          <p><b>Wallet:</b> ₹{u.wallet || 0}</p>

          {/* UPDATE BALANCE */}
          <Button
            onClick={async () => {
              const amount = prompt("Enter amount to add:");
              if (!amount) return;

              await supabase
                .from("profiles")
                .update({
                  wallet: (u.wallet || 0) + Number(amount)
                })
                .eq("id", u.id);

              load();
            }}
          >
            Add Balance
          </Button>

          {/* BAN TOGGLE */}
          <Button
            onClick={async () => {
              await supabase
                .from("profiles")
                .update({
                  is_banned: !u.is_banned
                })
                .eq("id", u.id);

              load();
            }}
          >
            {u.is_banned ? "Unban" : "Ban"}
          </Button>

          {/* SUSPEND TOGGLE */}
          <Button
            onClick={async () => {
              await supabase
                .from("profiles")
                .update({
                  is_suspended: !u.is_suspended
                })
                .eq("id", u.id);

              load();
            }}
          >
            {u.is_suspended ? "Unsuspend" : "Suspend"}
          </Button>

        </CardContent>
      </Card>
    ))}
  </div>
)}
{/* ECOMMERCE TASKS */}
{page === "manage-ecom" && (
  <div className="grid gap-3">
    {tasks.filter(t => t.subtype === "ecommerce").map(t => (
      <Card key={t.id}>
        <CardContent className="p-3 space-y-2">

          <p><b>{t.title}</b></p>
          <p>{t.link}</p>
          <p>Reward: ₹{t.reward}</p>

          {t.logo && (
            <img src={t.logo} alt="logo" className="w-16 h-16 object-contain" />
          )}

          {/* EDIT */}
          <Button onClick={() => {
            setForm(t);
            setEditingId(t.id);
            setPage("create");
          }}>
            Edit
          </Button>

          {/* DELETE */}
          <Button onClick={async () => {
            await supabase.from("tasks").delete().eq("id", t.id);
            load();
          }}>
            Delete
          </Button>

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
        <CardContent className="p-3 space-y-2">

          <p><b>{t.title}</b></p>
          <p>{t.link}</p>
          <p>Reward: ₹{t.reward}</p>

          {/* EDIT */}
          <Button onClick={() => {
            setForm(t);
            setEditingId(t.id);
            setPage("create");
          }}>
            Edit
          </Button>

          {/* DELETE */}
          <Button onClick={async () => {
            await supabase.from("tasks").delete().eq("id", t.id);
            load();
          }}>
            Delete
          </Button>

        </CardContent>
      </Card>
    ))}
  </div>
)}
  // ================= SUBMISSIONS =================
const handleSubmission = async (id, status) => {
  const { data: sub } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (!sub) return;

  const userEmail = sub.user || sub.email;

  // ================= APPROVE =================
  if (status === "approved") {
    // 🔥 get reward from task
    const { data: task } = await supabase
      .from("tasks")
      .select("reward")
      .eq("id", sub.taskId)
      .single();

    const { data: user } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", userEmail)
      .single();

    if (user) {
      await supabase
        .from("profiles")
        .update({
          wallet: (user.wallet || 0) + (task?.reward || 0)
        })
        .eq("email", userEmail);
    }
  }

  // ================= REJECT =================
  if (status === "rejected") {
    // 🔥 set 30 min cooldown
    const cooldownTime = new Date(Date.now() + 30 * 60 * 1000);

    await supabase
      .from("profiles")
      .update({
        cooldown_until: cooldownTime.toISOString()
      })
      .eq("email", userEmail);
  }

  // ================= DELETE SUBMISSION =================
  await supabase
    .from("submissions")
    .delete()
    .eq("id", id);

  load();
};
  // ================= WITHDRAW =================
 {/* WITHDRAW */}
{page === "payoff" && (
  <div className="grid gap-3">

    {withdrawals.length === 0 && (
      <p>No withdrawal requests</p>
    )}

    {withdrawals.map(w => (
      <Card key={w.id}>
        <CardContent className="p-3 space-y-2">

          <p><b>User:</b> {w.user}</p>
          <p><b>Amount:</b> ₹{w.amount}</p>
          <p><b>Status:</b> {w.status}</p>

          {/* APPROVE */}
          <Button onClick={async () => {
            const { data: user } = await supabase
              .from("profiles")
              .select("*")
              .eq("email", w.user)
              .single();

            if (user) {
              await supabase
                .from("profiles")
                .update({
                  wallet: (user.wallet || 0) - w.amount
                })
                .eq("email", w.user);
            }

            await supabase
              .from("withdrawals")
              .update({ status: "approved" })
              .eq("id", w.id);

            load();
          }}>
            Approve
          </Button>

          {/* REJECT */}
          <Button onClick={async () => {
            await supabase
              .from("withdrawals")
              .update({ status: "rejected" })
              .eq("id", w.id);

            load();
          }}>
            Reject
          </Button>

        </CardContent>
      </Card>
    ))}
  </div>
)}

  return (
    <div className="min-h-screen p-4 bg-white text-black">

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
          <Card><CardContent className="p-4">Approved: {submissions.filter(s => s.status === "approved").length}</CardContent></Card>
          <Card><CardContent className="p-4">Rejected: {submissions.filter(s => s.status === "rejected").length}</CardContent></Card>
          <Card><CardContent className="p-4">Users: {users.length}</CardContent></Card>
        </div>
      )}

      {/* CREATE TASK */}
      {page === "create" && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6 space-y-3">

            <input className="w-full p-3 border" placeholder="Title"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />

            <input className="w-full p-3 border" placeholder="Link"
              value={form.link}
              onChange={e => setForm({ ...form, link: e.target.value })}
            />

            <input className="w-full p-3 border" placeholder="Reward"
              value={form.reward}
              onChange={e => setForm({ ...form, reward: e.target.value })}
            />

            <select
              className="w-full p-3 border"
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

            {form.type === "affiliate" && (
              <select
                className="w-full p-3 border"
                value={form.subtype}
                onChange={(e) =>
                  setForm({ ...form, subtype: e.target.value })
                }
              >
                <option value="ecommerce">Ecommerce</option>
                <option value="general">General</option>
              </select>
            )}

            {form.subtype === "ecommerce" && (
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

            <Button onClick={saveTask} className="w-full">
              {editingId ? "Update Task" : "Create Task"}
            </Button>

          </CardContent>
        </Card>
      )}

      {/* SUBMISSIONS */}
      {page === "submissions" && (
        <div className="grid gap-3">
          {submissions.map(s => (
            <Card key={s.id}><CardContent className="p-3">
             <p>{s.user || s.email || "No User"}</p>

{s.img ? (
  <a href={s.img} target="_blank">View SS</a>
) : s.screenshot ? (
  <a href={s.screenshot} target="_blank">View SS</a>
) : (
  <p>No Screenshot</p>
)}
              <p>{s.status}</p>

              <Button onClick={() => handleSubmission(s.id, "approved")}>Approve</Button>
              <Button onClick={() => handleSubmission(s.id, "rejected")}>Reject</Button>
            </CardContent></Card>
          ))}
        </div>
      )}

      {/* WITHDRAW */}
      {page === "payoff" && (
        <div>
          {withdrawals.map(w => (
            <Card key={w.id}><CardContent className="p-3">
              <p>{w.user}</p>
              <p>₹{w.amount}</p>
              <p>{w.status}</p>

              <Button onClick={() => handleWithdraw(w.id, "approved")}>Approve</Button>
              <Button onClick={() => handleWithdraw(w.id, "rejected")}>Reject</Button>
            </CardContent></Card>
          ))}
        </div>
      )}

    </div>
  );
}
