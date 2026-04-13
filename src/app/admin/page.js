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
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);

  const [newTask, setNewTask] = useState({
    title: "",
    reward: "",
    link: "",
    type: "normal"
  });

  // 🔐 ACCESS CONTROL
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

  // 🔄 LOAD ALL DATA
  const loadData = async () => {
    // submissions
    const { data: subData } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });

    setSubmissions(subData || []);

    // users
    const { data: userData } = await supabase
      .from("profiles")
      .select("*");

    setUsers(userData || []);

    // tasks
    const { data: taskData } = await supabase
      .from("tasks")
      .select("*");

    setTasks(taskData || []);

    // withdrawals (localStorage)
    const w = JSON.parse(localStorage.getItem("gr_withdrawals") || "[]");
    setWithdrawals(w);
  };

  // ✅ APPROVE TASK
  const approveTask = async (item) => {
    await supabase
      .from("submissions")
      .update({ status: "approved" })
      .eq("id", item.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", item.user_id)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          wallet: (profile.wallet || 0) + 50
        })
        .eq("id", item.user_id);
    }

    alert("Approved + reward added ✅");
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

  // 👤 BAN / UNBAN
  const banUser = async (id) => {
    await supabase.from("profiles").update({ status: "banned" }).eq("id", id);
    loadData();
  };

  const unbanUser = async (id) => {
    await supabase.from("profiles").update({ status: "active" }).eq("id", id);
    loadData();
  };

  // ⏳ SUSPEND (1 hour)
  const suspendUser = async (id) => {
    const until = new Date(Date.now() + 60 * 60 * 1000);

    await supabase
      .from("profiles")
      .update({ suspended_until: until })
      .eq("id", id);

    loadData();
  };

  // 🧾 CREATE TASK
  const createTask = async () => {
    if (!newTask.title || !newTask.reward) {
      alert("Fill task fields ❌");
      return;
    }

    await supabase.from("tasks").insert([
      {
        title: newTask.title,
        reward: Number(newTask.reward),
        link: newTask.link,
        type: newTask.type
      }
    ]);

    setNewTask({ title: "", reward: "", link: "", type: "normal" });
    loadData();
  };

  // 🗑 DELETE TASK
  const deleteTask = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
    loadData();
  };

  // 💸 WITHDRAW ACTIONS
  const approveWithdraw = (i) => {
    const updated = [...withdrawals];
    updated[i].status = "approved";
    localStorage.setItem("gr_withdrawals", JSON.stringify(updated));
    setWithdrawals(updated);
  };

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

      {/* 🧾 TASKS */}
      <div>
        <h2 className="font-semibold mb-2">Tasks</h2>

        <div className="flex gap-2 mb-3">
          <input
            placeholder="Title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="border p-1"
          />
          <input
            placeholder="Reward"
            value={newTask.reward}
            onChange={(e) => setNewTask({ ...newTask, reward: e.target.value })}
            className="border p-1"
          />
          <input
            placeholder="Link"
            value={newTask.link}
            onChange={(e) => setNewTask({ ...newTask, link: e.target.value })}
            className="border p-1"
          />
          <Button onClick={createTask}>Add</Button>
        </div>

        {tasks.map((t) => (
          <Card key={t.id} className="mb-2">
            <CardContent className="p-2 flex justify-between">
              <span>{t.title} (₹{t.reward})</span>
              <Button onClick={() => deleteTask(t.id)}>Delete</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 📸 SUBMISSIONS */}
      <div>
        <h2 className="font-semibold mb-2">Submissions</h2>

        {submissions.map((s) => (
          <Card key={s.id} className="mb-3">
            <CardContent className="p-3 space-y-2">

              <p><b>User:</b> {s.user_id}</p>
              <p><b>Task:</b> {s.task_name}</p>
              <p><b>Status:</b> {s.status}</p>

              <img
                src={s.image_url}
                alt="proof"
                className="w-40 rounded border"
              />

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

      {/* 👤 USERS */}
      <div>
        <h2 className="font-semibold mb-2">Users</h2>

        {users.map((u) => (
          <Card key={u.id} className="mb-3">
            <CardContent className="p-3 space-y-2">

              <p>{u.email}</p>
              <p>Wallet: ₹{u.wallet}</p>
              <p>Status: {u.status || "active"}</p>

              <div className="flex gap-2">
                <Button onClick={() => banUser(u.id)}>Ban</Button>
                <Button onClick={() => unbanUser(u.id)}>Unban</Button>
                <Button onClick={() => suspendUser(u.id)}>Suspend</Button>
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
