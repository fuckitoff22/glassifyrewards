"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {

  const [tab, setTab] = useState("tasks");
  const [taskType, setTaskType] = useState("normal");

  const [tasks, setTasks] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);

  const [newTask, setNewTask] = useState({
    title: "",
    link: "",
    reward: "",
    type: "normal",
    logo: ""
  });

  // ================= LOAD =================
  const loadData = async () => {

    const { data: t } = await supabase.from("tasks").select("*");
    const { data: w } = await supabase.from("withdrawals").select("*");
    const { data: u } = await supabase.from("profiles").select("*");

    setTasks(t || []);
    setWithdrawals(w || []);
    setUsers(u || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ================= TASK =================

  const createTask = async () => {
    if (!newTask.title) return;

    await supabase.from("tasks").insert([newTask]);

    setNewTask({
      title: "",
      link: "",
      reward: "",
      type: taskType,
      logo: ""
    });

    loadData();
  };

  const deleteTask = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
    loadData();
  };

  const updateTask = async (task) => {
    await supabase.from("tasks").update(task).eq("id", task.id);
    loadData();
  };

  // ================= WITHDRAW =================

  const approveWithdraw = async (w) => {
    // update status
    await supabase
      .from("withdrawals")
      .update({ status: "approved" })
      .eq("id", w.id);

    // deduct already done → do nothing OR ensure consistency
    loadData();
  };

  const rejectWithdraw = async (w) => {
    // refund user
    const { data: user } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", w.user_id)
      .single();

    await supabase
      .from("profiles")
      .update({ wallet: (user.wallet || 0) + w.amount })
      .eq("id", w.user_id);

    await supabase
      .from("withdrawals")
      .update({ status: "rejected" })
      .eq("id", w.id);

    loadData();
  };

  return (
    <div className="p-6 space-y-6">

      {/* NAV */}
      <div className="flex gap-4 border-b pb-2">
        <button onClick={() => setTab("tasks")}>Tasks</button>
        <button onClick={() => setTab("ecom")}>Ecommerce</button>
        <button onClick={() => setTab("withdraw")}>Withdrawals</button>
      </div>

      {/* ================= TASKS ================= */}
      {tab === "tasks" && (
        <div className="space-y-4">

          {/* TYPE SWITCH */}
          <div className="flex gap-3">
            <button onClick={() => setTaskType("normal")}>Normal</button>
            <button onClick={() => setTaskType("affiliate")}>Affiliate</button>
          </div>

          {/* CREATE */}
          <div className="flex gap-2">
            <input
              placeholder="Title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            />

            <input
              placeholder="Link"
              value={newTask.link}
              onChange={(e) => setNewTask({ ...newTask, link: e.target.value })}
            />

            <input
              placeholder="Reward"
              value={newTask.reward}
              onChange={(e) => setNewTask({ ...newTask, reward: e.target.value })}
            />

            <button onClick={createTask}>Add</button>
          </div>

          {/* LIST */}
          {tasks
            .filter(t => t.type === taskType)
            .map(t => (
              <div key={t.id} className="border p-2 flex justify-between">

                <div>
                  <p>{t.title}</p>
                  <p>{t.reward}</p>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => deleteTask(t.id)}>Delete</button>
                </div>

              </div>
          ))}

        </div>
      )}

      {/* ================= ECOMMERCE ================= */}
      {tab === "ecom" && (
        <div className="space-y-4">

          <div className="flex gap-2">
            <input placeholder="Title"
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value, type: "ecommerce" })} />

            <input placeholder="Link"
              onChange={(e) => setNewTask({ ...newTask, link: e.target.value })} />

            <input placeholder="Reward"
              onChange={(e) => setNewTask({ ...newTask, reward: e.target.value })} />

            <input placeholder="Logo URL"
              onChange={(e) => setNewTask({ ...newTask, logo: e.target.value })} />

            <button onClick={createTask}>Add</button>
          </div>

          {tasks
            .filter(t => t.type === "ecommerce")
            .map(t => (
              <div key={t.id} className="border p-2 flex justify-between">

                <div>
                  <img src={t.logo} className="w-8" />
                  <p>{t.title}</p>
                </div>

                <button onClick={() => deleteTask(t.id)}>Delete</button>

              </div>
          ))}

        </div>
      )}

      {/* ================= WITHDRAW ================= */}
      {tab === "withdraw" && (
        <div className="space-y-4">

          {withdrawals.map(w => {
            const user = users.find(u => u.id === w.user_id);

            return (
              <div key={w.id} className="border p-3 flex justify-between">

                <div>
                  <p>{user?.name}</p>
                  <p>₹{w.amount}</p>
                  <p>{w.status}</p>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => approveWithdraw(w)}>Approve</button>
                  <button onClick={() => rejectWithdraw(w)}>Reject</button>
                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}
