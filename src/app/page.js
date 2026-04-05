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
function Chatbot({ close, selectedTask }) {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const user = JSON.parse(localStorage.getItem("gr_profile") || "{}").email || "guest";

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const submissions = JSON.parse(localStorage.getItem("gr_submissions") || "[]");

      submissions.push({
        id: Date.now(),
        task: selectedTask,
        taskId: selectedTask?.id,
        user,
        img: reader.result,
        status: "pending"
      });

      localStorage.setItem("gr_submissions", JSON.stringify(submissions));
      setChat(prev => [...prev, { type: "bot", text: "Screenshot uploaded ✅" }]);
    };

    reader.readAsDataURL(file);
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    setChat(prev => [
      ...prev,
      { type: "user", text: message },
      { type: "bot", text: selectedTask ? `Task: ${selectedTask.title}` : "Ask about tasks or withdrawal." }
    ]);

    setMessage("");
  };

  return (
    <div className="fixed bottom-20 right-6 w-80">
      <Card className="bg-white/40 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
        <CardContent className="p-4">
          <div className="flex justify-between mb-2">
            <span>Assistant</span>
            <X onClick={close}/>
          </div>

          {selectedTask && <p className="text-xs">Task: {selectedTask.title}</p>}

          <div className="h-40 overflow-y-auto text-sm">
            {chat.map((c,i)=><div key={i}>{c.text}</div>)}
          </div>

          <input type="file" onChange={handleUpload} />

          <div className="flex gap-2 mt-2">
            <input value={message} onChange={e=>setMessage(e.target.value)} className="flex-1 border p-1"/>
            <Button onClick={sendMessage}>Send</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------- Profile ----------------
function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(true);
  const [showWallet, setShowWallet] = useState(false);

  const [form, setForm] = useState({ name:"", email:"", method:"", details:"" });

  useEffect(()=>{
    const saved = JSON.parse(localStorage.getItem("gr_profile")||"null");
    if(saved){ setProfile(saved); setForm(saved); setEditing(false); }
  },[]);

  const save = () => {
    localStorage.setItem("gr_profile", JSON.stringify(form));
    setProfile(form);
    setEditing(false);
  };

  return (
    <Card className="p-6 space-y-4">

      {!editing && profile && (
        <>
          <h3>{profile.name}</h3>
          <p>{profile.email}</p>
          <p>{profile.method} : {profile.details}</p>

          <div className="flex gap-2">
            <Button onClick={()=>setEditing(true)}>Edit</Button>
            <Button onClick={()=>setShowWallet(!showWallet)}>Wallet</Button>
            <Button onClick={()=>{localStorage.removeItem("gr_profile");location.reload();}} className="bg-red-500 text-white">
              Logout
            </Button>
          </div>
        </>
      )}

      {editing && (
        <>
          <input placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
          <input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
          <input placeholder="Method" value={form.method} onChange={e=>setForm({...form,method:e.target.value})}/>
          <input placeholder="Details" value={form.details} onChange={e=>setForm({...form,details:e.target.value})}/>
          <Button onClick={save}>Save</Button>
        </>
      )}

      {showWallet && (
  <div className="p-4 bg-white/20 backdrop-blur-xl rounded-xl mt-3 border border-white/30">
    {(() => {
      const subs = JSON.parse(localStorage.getItem("gr_submissions") || "[]");
      const withdrawals = JSON.parse(localStorage.getItem("gr_withdrawals") || "[]");

      const approved = subs.filter(s => s.status === "approved");

      const totalEarn = approved.reduce((a, s) => a + (s.task?.reward || 0), 0);

      const totalWithdrawn = withdrawals
        .filter(w => w.status === "approved")
        .reduce((a, w) => a + w.amount, 0);

      const balance = totalEarn - totalWithdrawn;

      return (
        <>
          <p className="font-semibold">Balance: ₹{balance}</p>

          <input
            id="withdrawAmount"
            placeholder="Enter amount"
            className="w-full p-2 mt-2 rounded bg-white/50"
          />

          <Button
            className="mt-2 w-full"
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
                user: profile?.email,
                status: "pending"
              });

              localStorage.setItem("gr_withdrawals", JSON.stringify(w));

              alert("Withdrawal Requested ✅");
            }}
          >
            Request Withdraw
          </Button>
        </>
      );
    })()}
  </div>
)}
    </Card>
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
