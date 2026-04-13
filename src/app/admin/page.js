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

  const [editingWallet, setEditingWallet] = useState({});

  const [newTask, setNewTask] = useState({
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

  // 🔄 LOAD
  const loadData = async () => {
    const { data: u } = await supabase.from("profiles").select("*");
    const { data: s } = await supabase.from("submissions").select("*");
    const { data: t } = await supabase.from("tasks").select("*");

    setUsers(u || []);
    setSubs(s || []);
    setTasks(t || []);
  };

  // ================= USERS =================

  const saveWallet = async (id) => {
    const amount = Number(editingWallet[id]);

    if (isNaN(amount)) {
      alert("Enter valid number ❌");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ wallet: amount })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Wallet update failed ❌");
    } else {
      alert("Wallet updated ✅");
      loadData();
    }
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
    if (!newTask.title || !newTask.reward) {
      alert("Fill fields ❌");
      return;
    }

    await supabase.from("tasks").insert([newTask]);
    setNewTask({ title: "", reward: "", link: "", type: "normal", logo: "" });
    loadData();
  };

  const deleteTask = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
    loadData();
  };

  // ================= SUBMISSIONS =================

  const handleDecision = async (s, action) => {
    try {
      console.log("Processing:", s);

      // extract path safely
      const path = s.image_url.split("/screenshots/")[1];

      if (path) {
        await supabase.storage.from("screenshots").remove([path]);
      }

      await supabase.from("submissions").delete().eq("id", s.id);

      if (action === "approve") {
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

      alert(action === "approve" ? "Approved ✅" : "Rejected ❌");
      loadData();

    } catch (err) {
      console.error(err);
      alert("Action failed ❌");
    }
  };

  if (!allowed) return null;

  return (
    <div className="p-6 space-y-6">

      {/* NAV */}
      <div className="flex gap-6 border-b pb-2">
        <button onClick={() => setTab("dashboard")}>Dashboard</button>
        <button onClick={() => setTab("tasks")}>Tasks</button>
        <button onClick={() => setTab("users")}>Users</button>
        <button onClick={() => setTab("subs")}>Submissions</button>
      </div>

      {/* DASHBOARD */}
      {tab === "dashboard" && (
        <div className="flex justify-between">
          <p>Submissions: {subs.length}</p>
          <p>Users: {users.length}</p>
        </div>
      )}

      {/* TASKS */}
      {tab === "tasks" && (
        <div className="space-y-6">

          {/* CREATE */}
          <div className="flex gap-2 flex-wrap">
            <input placeholder="Title"
              value={newTask.title}
              onChange={e => setNewTask({ ...newTask, title: e.target.value })} />

            <input placeholder="Link"
              value={newTask.link}
              onChange={e => setNewTask({ ...newTask, link: e.target.value })} />

            <input placeholder="Reward"
              value={newTask.reward}
              onChange={e => setNewTask({ ...newTask, reward: e.target.value })} />

            <select
              value={newTask.type}
              onChange={e => setNewTask({ ...newTask, type: e.target.value })}
            >
              <option value="normal">Normal</option>
              <option value="affiliate">Affiliate General</option>
              <option value="ecommerce">Affiliate Ecommerce</option>
            </select>

            {newTask.type === "ecommerce" && (
              <input placeholder="Logo URL"
                onChange={e => setNewTask({ ...newTask, logo: e.target.value })} />
            )}

            <Button onClick={createTask}>Add</Button>
          </div>

          {/* NORMAL */}
          <div>
            <h3>Normal Tasks</h3>
            {tasks.filter(t => t.type === "normal").map(t => (
              <div key={t.id} className="flex justify-between border p-2">
                {t.title}
                <Button onClick={() => deleteTask(t.id)}>Delete</Button>
              </div>
            ))}
          </div>

          {/* AFFILIATE */}
          <div>
            <h3>Affiliate General</h3>
            {tasks.filter(t => t.type === "affiliate").map(t => (
              <div key={t.id} className="flex justify-between border p-2">
                {t.title}
                <Button onClick={() => deleteTask(t.id)}>Delete</Button>
              </div>
            ))}
          </div>

          {/* ECOMMERCE */}
          <div>
            <h3>Affiliate Ecommerce</h3>
            {tasks.filter(t => t.type === "ecommerce").map(t => (
              <div key={t.id} className="flex justify-between border p-2">
                {t.title}
                <Button onClick={() => deleteTask(t.id)}>Delete</Button>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* USERS */}
      {tab === "users" && (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="border p-3">

              <p>{u.name}</p>

              <input
                value={editingWallet[u.id] ?? u.wallet ?? ""}
                onChange={(e) =>
                  setEditingWallet({ ...editingWallet, [u.id]: e.target.value })
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
        <div className="space-y-4">

          {subs.map(s => {
            const user = users.find(u => u.id === s.user_id);

            return (
              <div key={s.id} className="border p-3">

                <p>{user?.name}</p>
                <p>{user?.email}</p>

                <a href={s.image_url} target="_blank">
                  <Button>View</Button>
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

    </div>
  );
}
