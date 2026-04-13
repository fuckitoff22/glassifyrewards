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

  const [suspendUserId, setSuspendUserId] = useState(null);
  const [suspendTime, setSuspendTime] = useState("");

  const [newTask, setNewTask] = useState({
    title: "",
    reward: "",
    link: ""
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
    setUsers(u || []);

    const { data: s } = await supabase.from("submissions").select("*");
    setSubs(s || []);

    const { data: t } = await supabase.from("tasks").select("*");
    setTasks(t || []);

    const w = JSON.parse(localStorage.getItem("gr_withdrawals") || "[]");
    setWithdrawals(w);
  };

  // ================= USERS =================

  const updateWallet = async (id, amount) => {
    await supabase.from("profiles").update({ wallet: amount }).eq("id", id);
    loadData();
  };

  const toggleBan = async (u) => {
    await supabase
      .from("profiles")
      .update({ status: u.status === "banned" ? "active" : "banned" })
      .eq("id", u.id);
    loadData();
  };

  const applySuspend = async () => {
    const until = new Date(Date.now() + suspendTime * 60000);
    await supabase
      .from("profiles")
      .update({ suspended_until: until })
      .eq("id", suspendUserId);

    setSuspendUserId(null);
    setSuspendTime("");
    loadData();
  };

  // ================= TASK =================

  const createTask = async () => {
    if (!newTask.title || !newTask.reward) return;

    await supabase.from("tasks").insert([
      {
        title: newTask.title,
        reward: Number(newTask.reward),
        link: newTask.link
      }
    ]);

    setNewTask({ title: "", reward: "", link: "" });
    loadData();
  };

  const deleteTask = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
    loadData();
  };

  // ================= SUBMISSIONS =================

  const approve = async (s) => {
    await supabase.from("submissions").update({ status: "approved" }).eq("id", s.id);

    const { data: user } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", s.user_id)
      .single();

    await supabase
      .from("profiles")
      .update({ wallet: (user.wallet || 0) + 50 })
      .eq("id", s.user_id);

    loadData();
  };

  const reject = async (s) => {
    // ❌ delete image from storage
    const path = s.image_url.split("/").pop();
    await supabase.storage.from("screenshots").remove([path]);

    // ❌ delete DB row
    await supabase.from("submissions").delete().eq("id", s.id);

    loadData();
  };

  // ================= WITHDRAW =================

  const approveW = (i) => {
    const w = [...withdrawals];
    w[i].status = "approved";
    localStorage.setItem("gr_withdrawals", JSON.stringify(w));
    setWithdrawals(w);
  };

  const rejectW = (i) => {
    const w = [...withdrawals];
    w[i].status = "rejected";
    localStorage.setItem("gr_withdrawals", JSON.stringify(w));
    setWithdrawals(w);
  };

  if (!allowed) return null;

  return (
    <div className="p-6 space-y-6">

      {/* NAV */}
      <div className="flex gap-6 border-b pb-2">
        <button onClick={() => setTab("dashboard")}>Dashboard</button>
        <button onClick={() => setTab("tasks")}>Create Task</button>
        <button onClick={() => setTab("users")}>Users</button>
        <button onClick={() => setTab("subs")}>Submissions</button>
        <button onClick={() => setTab("pay")}>Payoff</button>
      </div>

      {/* DASHBOARD */}
      {tab === "dashboard" && (
        <div className="flex justify-between">
          <p>Approved: {subs.filter(s => s.status === "approved").length}</p>
          <p>Rejected: {subs.filter(s => s.status === "rejected").length}</p>
          <p>Users: {users.length}</p>
        </div>
      )}

      {/* TASKS */}
      {tab === "tasks" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input placeholder="title" value={newTask.title}
              onChange={e => setNewTask({ ...newTask, title: e.target.value })} />

            <input placeholder="reward" value={newTask.reward}
              onChange={e => setNewTask({ ...newTask, reward: e.target.value })} />

            <input placeholder="link" value={newTask.link}
              onChange={e => setNewTask({ ...newTask, link: e.target.value })} />

            <Button onClick={createTask}>Add</Button>
          </div>

          {tasks.map(t => (
            <div key={t.id} className="flex justify-between border p-2">
              <span>{t.title} ₹{t.reward}</span>
              <Button onClick={() => deleteTask(t.id)}>Delete</Button>
            </div>
          ))}
        </div>
      )}

      {/* USERS */}
      {tab === "users" && (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="border p-3 space-y-2">

              <p>{u.name}</p>

              <input
                defaultValue={u.wallet}
                onBlur={(e) => updateWallet(u.id, Number(e.target.value))}
              />

              <div className="flex gap-2">
                <Button onClick={() => toggleBan(u)}>
                  {u.status === "banned" ? "Unban" : "Ban"}
                </Button>

                <Button onClick={() => setSuspendUserId(u.id)}>
                  Suspend
                </Button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* SUBMISSIONS */}
      {tab === "subs" && (
        <div className="space-y-4">
          {subs.map(s => (
            <div key={s.id} className="border p-3 space-y-2">

              <p>{s.task_name}</p>
              <img src={s.image_url} className="w-40" />

              <div className="flex gap-2">
                <Button onClick={() => approve(s)}>Approve</Button>
                <Button onClick={() => reject(s)}>Reject</Button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* PAYOUT */}
      {tab === "pay" && (
        <div className="space-y-3">
          {withdrawals.map((w, i) => (
            <div key={i} className="border p-3 flex justify-between">
              <span>₹{w.amount}</span>

              <div className="flex gap-2">
                <Button onClick={() => approveW(i)}>Approve</Button>
                <Button onClick={() => rejectW(i)}>Reject</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUSPEND POPUP */}
      {suspendUserId && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-5 space-y-3">

            <h3>Suspend (minutes)</h3>

            <input
              type="number"
              value={suspendTime}
              onChange={(e) => setSuspendTime(e.target.value)}
            />

            <div className="flex gap-2">
              <Button onClick={applySuspend}>Apply</Button>
              <Button onClick={() => setSuspendUserId(null)}>Cancel</Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
