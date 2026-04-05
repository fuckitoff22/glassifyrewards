"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, X, ExternalLink, MessageCircle } from "lucide-react";

export default function GlassifyApp() {

  useEffect(() => {
    let stored = JSON.parse(localStorage.getItem("gr_tasks") || "[]");

    const demoTasks = [
      { id: 1, title: "Follow Instagram", reward: 30, link: "https://instagram.com", type: "normal" },
      { id: 2, title: "Watch Video", reward: 20, link: "https://youtube.com", type: "normal" },
      { id: 3, title: "Signup via link", reward: 100, link: "https://example.com", type: "affiliate", subtype: "general" },
      { id: 4, title: "Purchase product", reward: 200, link: "https://example.com", type: "affiliate", subtype: "ecommerce", logo: "https://cdn-icons-png.flaticon.com/512/5968/5968870.png" }
    ];

    const merged = [...demoTasks, ...stored.filter(s => !demoTasks.find(d => d.id === s.id))];
    localStorage.setItem("gr_tasks", JSON.stringify(merged));
  }, []);

  const [page, setPage] = useState("dashboard");
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`min-h-screen p-4 ${darkMode 
        ? "bg-gradient-to-br from-black via-red-900 to-black text-white" 
        : "bg-gradient-to-br from-blue-50 via-white to-blue-100 text-black"}`}>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">GlassifyRewards</h1>
        <div className="flex gap-2 items-center">
          <Button onClick={() => setPage("dashboard")}>Dashboard</Button>
          <Button onClick={() => setPage("tasks")}>Tasks</Button>
          <Button onClick={() => setPage("profile")}>Profile</Button>
<Button onClick={() => setPage("transactions")}>Transactions</Button>
          <Button 
            onClick={() => setDarkMode(!darkMode)}
            className={`${darkMode ? "bg-red-500 text-white" : "bg-black text-white"}`}
          >
            {darkMode ? "Light" : "Dark"}
          </Button>
        </div>
      </div>

      {page === "dashboard" && <Dashboard />}
      {page === "tasks" && <TasksPage setChatOpen={setChatOpen} setSelectedTask={setSelectedTask} />}
      {page === "profile" && <ProfilePage />}
{page === "transactions" && <TransactionsPage />}
      {/* ✅ FLOATING + SHADOW FIXED */}
      <motion.div
        className="fixed bottom-6 right-6"
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        whileHover={{ scale: 1.1 }}
      >
        <Button
          onClick={() => setChatOpen(true)}
          className="rounded-full w-14 h-14 bg-blue-500 text-white shadow-[0_10px_40px_rgba(59,130,246,0.6)]"
        >
          <MessageCircle />
        </Button>
      </motion.div>

      {chatOpen && (
        <Chatbot close={() => setChatOpen(false)} selectedTask={selectedTask} />
      )}
    </div>
  );
}

// ---------------- Dashboard ----------------
function Dashboard() {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const load = () => {
      setSubmissions(JSON.parse(localStorage.getItem("gr_submissions") || "[]"));
    };
    load();
    const interval = setInterval(load, 1000);
    return () => clearInterval(interval);
  }, []);

  const approved = submissions.filter(s => s.status === "approved");

  const total = approved.reduce((acc, s) => acc + (s.task?.reward || 0), 0);

  return (
    <div className="space-y-4">

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4">Earnings: ₹{total}</CardContent></Card>
        <Card><CardContent className="p-4">Approved: {approved.length}</CardContent></Card>
        <Card><CardContent className="p-4">Total Tasks: {submissions.length}</CardContent></Card>
      </div>

      {/* Task History */}
      <div className="space-y-2">
        {submissions.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-3 text-sm">
              <p><b>Task:</b> {s.task?.title || "N/A"}</p>
              <p>Status: {s.status}</p>
              <p>Reward: ₹{s.task?.reward || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}
// ---------------- Tasks ----------------
function TasksPage({ setChatOpen, setSelectedTask }) {
  const [tab, setTab] = useState("normal");
  const [tasks, setTasks] = useState([]);
  const [popupTask, setPopupTask] = useState(null);

  useEffect(() => {
    const load = () => {
      setTasks(JSON.parse(localStorage.getItem("gr_tasks") || "[]"));
    };

    load();
    const interval = setInterval(load, 1000);
    window.addEventListener("storage", load);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", load);
    };
  }, []);

  const user = JSON.parse(localStorage.getItem("gr_profile") || "{}").email || "guest";

  // ✅ GET LATEST SUBMISSION ONLY
  const getLatestRecord = (taskId) => {
    const subs = JSON.parse(localStorage.getItem("gr_submissions") || "[]");

    const records = subs
      .filter(s => s.taskId === taskId && s.user === user)
      .sort((a, b) => b.id - a.id);

    return records[0];
  };

  // ✅ PURE STATUS (NO SIDE EFFECTS)
  const getStatus = (taskId) => {
    const record = getLatestRecord(taskId);

    if (!record) return "allow";

    if (record.status === "approved") return "hide";

    if (record.status === "pending") return "pending";

    if (record.status === "rejected") {
      const rejectedAt = record.rejectedAt || 0;

      if (Date.now() - rejectedAt < 30 * 60 * 1000) {
        return "cooldown";
      }

      return "allow";
    }

    return "allow";
  };

  const normal = tasks.filter(t => t.type === "normal");
  const affiliate = tasks.filter(t => t.type === "affiliate" && t.subtype !== "ecommerce");
  const ecommerce = tasks.filter(t => t.type === "affiliate" && t.subtype === "ecommerce");

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button onClick={()=>setTab("normal")}>Normal</Button>
        <Button onClick={()=>setTab("affiliate")}>Affiliate</Button>
      </div>

      {tab === "affiliate" && (
        <div className="mb-4">
          <h3>E-commerce Offers</h3>
          <div className="grid grid-cols-3 gap-3">
            {ecommerce.map(t => (
              <Card key={t.id} onClick={()=>window.open(t.link)}>
                <CardContent className="p-3 text-center">
                  {t.logo && <img src={t.logo} className="w-10 mx-auto" />}
                  <p>{t.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-3">
        {(tab==="normal"?normal:affiliate)
          .filter(t => getStatus(t.id) !== "hide") // remove approved
          .map(t=>{
            const status = getStatus(t.id);
            const isLocked = status !== "allow";

            return (
              <Card key={t.id}>
                <CardContent className="p-3">
                  <h3>{t.title}</h3>
                  <p>₹{t.reward}</p>

                  <div className="flex gap-2 mt-2">

                    {/* VISIT */}
                    <Button
                      disabled={isLocked}
                      onClick={()=>{
                        if (isLocked) {
                          setPopupTask(status);
                          return;
                        }
                        window.open(t.link);
                      }}
                    >
                      Visit
                    </Button>

                    {/* SUBMIT */}
                    <Button
                      disabled={isLocked}
                      onClick={() => {
                        if (isLocked) {
                          setPopupTask(status);
                          return;
                        }

                        setSelectedTask(t);
                        setChatOpen(true);
                      }}
                    >
                      Submit
                    </Button>

                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* 🔥 SMART GLASS POPUP */}
      {popupTask && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <div className="bg-white/20 backdrop-blur-xl border border-white/40 p-6 rounded-2xl shadow-xl w-80 text-center">
            
            <h3 className="font-semibold mb-2">
              {popupTask === "pending" && "Under Verification"}
              {popupTask === "cooldown" && "Retry Locked"}
            </h3>

            <p className="text-sm text-gray-200">
              {popupTask === "pending" &&
                "This task is under verification. It may take 24–48 hours. If rejected, you can retry."}

              {popupTask === "cooldown" &&
                "This task was rejected. Please wait 30 minutes before retrying."}
            </p>

            <Button className="mt-4" onClick={()=>setPopupTask(null)}>
              OK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
// ---------------- Chatbot ----------------
import { supabase } from "@/lib/supabase";

const handleUpload = async (e) => {
  if (!selectedTask) {
    alert("No task selected");
    return;
  }

  const file = e.target.files[0];
  if (!file) return;

  const fileName = `${Date.now()}-${file.name}`;

  // 🔥 Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from("screenshots")
    .upload(fileName, file);

  if (error) {
    alert("Upload failed");
    return;
  }

  // 🔥 Get public URL
  const { data: publicUrl } = supabase.storage
    .from("screenshots")
    .getPublicUrl(fileName);

  // 🔥 Save in DB
  await supabase.from("submissions").insert([
    {
      task_id: selectedTask.id,
      user_email: user,
      image_url: publicUrl.publicUrl,
      status: "pending",
    },
  ]);

  alert("Screenshot uploaded ✅");
};
// ---------------- Profile ----------------
function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    method: "upi",
    details: ""
  });

  const [balance, setBalance] = useState(0);

  useEffect(() => {
    setMounted(true);

    // Load profile
    const saved = JSON.parse(localStorage.getItem("gr_profile") || "null");
    if (saved) {
      setProfile(saved);
      setForm(saved);
      setEditing(false);
    }

    // Load wallet balance
    const subs = JSON.parse(localStorage.getItem("gr_submissions") || "[]");
    const withdrawals = JSON.parse(localStorage.getItem("gr_withdrawals") || "[]");

    const approved = subs.filter(s => s.status === "approved");

    const totalEarn = approved.reduce((a, s) => a + (s.task?.reward || 0), 0);

    const totalWithdrawn = withdrawals
      .filter(w => w.status === "approved")
      .reduce((a, w) => a + w.amount, 0);

    setBalance(totalEarn - totalWithdrawn);
  }, []);

  if (!mounted) return null;

  const save = () => {
    if (!form.name || !form.email || !form.details) {
      alert("Fill all fields");
      return;
    }

    localStorage.setItem("gr_profile", JSON.stringify(form));
    setProfile(form);
    setEditing(false);
  };

  return (
    <div className="max-w-md mx-auto space-y-4">

      {/* PROFILE CARD */}
      <Card className="p-5 space-y-3">

        {editing ? (
          <>
            <input
              placeholder="Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full p-2 border rounded"
            />

            <input
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full p-2 border rounded"
            />

            {/* PAYMENT METHOD */}
            <select
              value={form.method}
              onChange={e => setForm({ ...form, method: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="upi">UPI</option>
              <option value="wallet">Wallet</option>
              <option value="bank">Bank</option>
            </select>

            {/* DYNAMIC INPUT */}
            <input
              placeholder={
                form.method === "upi"
                  ? "Enter UPI ID"
                  : form.method === "wallet"
                  ? "Enter Wallet Number"
                  : "Enter Bank Details"
              }
              value={form.details}
              onChange={e => setForm({ ...form, details: e.target.value })}
              className="w-full p-2 border rounded"
            />

            <div className="flex gap-2">
              <Button className="w-full" onClick={save}>
                Save
              </Button>
            </div>
          </>
        ) : (
          <>
            <h3 className="font-semibold text-lg">{profile.name}</h3>
            <p>{profile.email}</p>
            <p className="text-sm text-gray-600">
              {profile.method.toUpperCase()} : {profile.details}
            </p>

            <div className="flex gap-2">
              <Button onClick={() => setEditing(true)}>Edit</Button>

              <Button
                className="bg-red-500 text-white"
                onClick={() => {
                  localStorage.removeItem("gr_profile");
                  location.reload();
                }}
              >
                Logout
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* 💰 WALLET SECTION */}
      {!editing && (
        <Card className="p-5 space-y-3">
          <h3 className="font-semibold">Wallet</h3>

          <p className="text-lg font-bold">₹{balance}</p>

          <input
            id="withdrawAmount"
            placeholder="Enter amount"
            className="w-full p-2 border rounded"
          />

          <Button
            className="w-full"
            disabled={balance < 100}
            onClick={() => {
              const amount = Number(document.getElementById("withdrawAmount").value);

              if (!amount || amount <= 0) {
                alert("Enter valid amount");
                return;
              }

              if (amount > balance) {
                alert("Insufficient balance");
                return;
              }

              const w = JSON.parse(localStorage.getItem("gr_withdrawals") || "[]");

              w.push({
                id: Date.now(),
                amount,
                user: profile.email,
                status: "pending"
              });

              localStorage.setItem("gr_withdrawals", JSON.stringify(w));

              alert("Withdrawal Requested ✅");
            }}
          >
            Withdraw
          </Button>

          <p className="text-xs text-gray-500">
            Minimum withdraw: ₹100
          </p>
        </Card>
      )}
    </div>
  );
}
// ---------------- TransactionPage ----------------
function TransactionsPage() {
  const [withdrawals, setWithdrawals] = useState([]);

  useEffect(() => {
    const load = () => {
      setWithdrawals(JSON.parse(localStorage.getItem("gr_withdrawals") || "[]"));
    };

    load();
    const interval = setInterval(load, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">

      <h2 className="text-xl font-semibold">Transactions</h2>

      {withdrawals.length === 0 && (
        <p className="text-gray-500">No transactions yet</p>
      )}

      {withdrawals.map((w, i) => (
        <Card key={i} className="bg-white/40 backdrop-blur-xl border border-white/30 rounded-2xl">
          <CardContent className="p-4 space-y-1">

            <p><b>Amount:</b> ₹{w.amount}</p>

            <p>
              <b>Status:</b>{" "}
              <span className={
                w.status === "approved"
                  ? "text-green-600"
                  : w.status === "rejected"
                  ? "text-red-500"
                  : "text-yellow-500"
              }>
                {w.status}
              </span>
            </p>

            <p className="text-xs text-gray-500">
              {new Date(w.id).toLocaleString()}
            </p>

          </CardContent>
        </Card>
      ))}

    </div>
  );
}
