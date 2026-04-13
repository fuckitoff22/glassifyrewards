"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const router = useRouter();

  const [tab, setTab] = useState("dashboard");
  const [allowed, setAllowed] = useState(false);

  const [users, setUsers] = useState([]);
  const [subs, setSubs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);

  const [walletEdit, setWalletEdit] = useState({});

  const [taskForm, setTaskForm] = useState({
    title: "",
    reward: "",
    link: "",
    type: "normal",
    logo: ""
  });

  // 🔐 ACCESS
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("key");
    if (key !== process.env.NEXT_PUBLIC_ADMIN_KEY) {
      router.push("/");
    } else {
      setAllowed(true);
      loadData();
    }
  }, []);

  // 🔄 LOAD DATA
  const loadData = async () => {
    const { data: u } = await supabase.from("profiles").select("*");
    const { data: s } = await supabase.from("submissions").select("*");
    const { data: t } = await supabase.from("tasks").select("*");
    const { data: w } = await supabase.from("withdrawals").select("*");

    setUsers(u || []);
    setSubs(s || []);
    setTasks(t || []);
    setWithdrawals(w || []);
  };

  // ================= USERS =================

  const saveWallet = async (id) => {
    await supabase
      .from("profiles")
      .update({ wallet: Number(walletEdit[id]) })
      .eq("id", id);

    loadData();
  };

  const toggleBan = async (u) => {
    await supabase
      .from("profiles")
      .update({ status: u.status === "banned" ? "active" : "banned" })
      .eq("id", u.id);

    loadData();
  };

  // ================= TASK =================

  const createTask = async () => {
    await supabase.from("tasks").insert([taskForm]);
    setTaskForm({ title: "", reward: "", link: "", type: "normal", logo: "" });
    loadData();
  };

  const deleteTask = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
    loadData();
  };

  // ================= SUBMISSIONS =================

  const handleDecision = async (s, type) => {
    const path = s.image_url.split("/screenshots/")[1];

    if (path) {
      await supabase.storage.from("screenshots").remove([path]);
    }

    await supabase.from("submissions").delete().eq("id", s.id);

    if (type === "approve") {
      const { data: user } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", s.user_id)
        .single();

      await supabase
        .from("profiles")
        .update({ wallet: (user.wallet || 0) + 50 })
        .eq("id", s.user_id);
    }

    loadData();
  };

  // ================= PAYOUT =================

  const approveWithdraw = async (w) => {
    await supabase
      .from("withdrawals")
      .update({ status: "approved" })
      .eq("id", w.id);

    const { data: user } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", w.user_id)
      .single();

    await supabase
      .from("profiles")
      .update({ wallet: (user.wallet || 0) - w.amount })
      .eq("id", w.user_id);

    loadData();
  };

  const rejectWithdraw = async (w) => {
    await supabase
      .from("withdrawals")
      .update({ status: "rejected" })
      .eq("id", w.id);

    loadData();
  };

  if (!allowed) return null;

  return (
    <div className="p-6 space-y-6">

      {/* NAV */}
      <div className="flex gap-4 border-b pb-2">
        <button onClick={() => setTab("dashboard")}>Dashboard</button>
        <button onClick={() => setTab("tasks")}>Tasks</button>
        <button onClick={() => setTab("ecom")}>Ecommerce</button>
        <button onClick={() => setTab("users")}>Users</button>
        <button onClick={() => setTab("subs")}>Submissions</button>
        <button onClick={() => setTab("pay")}>Payouts</button>
      </div>

      {/* DASHBOARD */}
      {tab === "dashboard" && (
        <div className="flex justify-between">
          <p>Users: {users.length}</p>
          <p>Tasks: {tasks.length}</p>
          <p>Submissions: {subs.length}</p>
        </div>
      )}

      {/* TASKS (NORMAL + AFFILIATE) */}
      {tab === "tasks" && (
        <div className="space-y-4">

          <div className="flex gap-2">
            <input placeholder="Title"
              value={taskForm.title}
              onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />

            <input placeholder="Reward"
              value={taskForm.reward}
              onChange={e => setTaskForm({ ...taskForm, reward: e.target.value })} />

            <input placeholder="Link"
              value={taskForm.link}
              onChange={e => setTaskForm({ ...taskForm, link: e.target.value })} />

            <select
              value={taskForm.type}
              onChange={e => setTaskForm({ ...taskForm, type: e.target.value })}
            >
              <option value="normal">Normal</option>
              <option value="affiliate">Affiliate</option>
            </select>

            <Button onClick={createTask}>Add</Button>
          </div>

          {tasks
            .filter(t => t.type !== "ecommerce")
            .map(t => (
              <div key={t.id} className="flex justify-between border p-2">
                {t.title} ₹{t.reward}
                <Button onClick={() => deleteTask(t.id)}>Delete</Button>
              </div>
          ))}

        </div>
      )}

      {/* ECOMMERCE */}
      {tab === "ecom" && (
        <div className="space-y-4">

          <div className="flex gap-2">
            <input placeholder="Title"
              onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />

            <input placeholder="Reward"
              onChange={e => setTaskForm({ ...taskForm, reward: e.target.value })} />

            <input placeholder="Link"
              onChange={e => setTaskForm({ ...taskForm, link: e.target.value })} />

            <input placeholder="Logo URL"
              onChange={e => setTaskForm({ ...taskForm, logo: e.target.value, type: "ecommerce" })} />

            <Button onClick={createTask}>Add</Button>
          </div>

          {tasks
            .filter(t => t.type === "ecommerce")
            .map(t => (
              <div key={t.id} className="flex justify-between border p-2">
                <img src={t.logo} className="w-8" />
                {t.title}
                <Button onClick={() => deleteTask(t.id)}>Delete</Button>
              </div>
          ))}

        </div>
      )}

      {/* USERS */}
      {tab === "users" && (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="border p-3">

              <p>{u.name}</p>

              <input
                placeholder="Wallet"
                value={walletEdit[u.id] ?? u.wallet ?? ""}
                onChange={e =>
                  setWalletEdit({ ...walletEdit, [u.id]: e.target.value })
                }
              />

              <div className="flex gap-2 mt-2">
                <Button onClick={() => saveWallet(u.id)}>Save</Button>

                <Button onClick={() => toggleBan(u)}>
                  {u.status === "banned" ? "Unban" : "Ban"}
                </Button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* SUBMISSIONS */}
      {tab === "subs" && (
        <div className="space-y-3">
          {subs.map(s => {
            const user = users.find(u => u.id === s.user_id);

            return (
              <div key={s.id} className="border p-3">

                <p>{user?.name}</p>
                <p>{user?.email}</p>

                <a href={s.image_url} target="_blank">
                  <Button>View Screenshot</Button>
                </a>

                <div className="flex gap-2 mt-2">
                  <Button onClick={() => handleDecision(s, "approve")}>
                    Approve
                  </Button>

                  <Button onClick={() => handleDecision(s, "reject")}>
                    Reject
                  </Button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* PAYOUT */}
      {tab === "pay" && (
        <div className="space-y-3">
          {withdrawals.map(w => (
            <div key={w.id} className="border p-3 flex justify-between">

              <div>
                <p>₹{w.amount}</p>
                <p>{w.status}</p>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => approveWithdraw(w)}>Approve</Button>
                <Button onClick={() => rejectWithdraw(w)}>Reject</Button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
