"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; 
import { User, X, ExternalLink, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function GlassifyApp() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState("dashboard");
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // ✅ FIXED AUTH + PROFILE SYNC (NO UI CHANGE)
// ✅ FINAL STABLE AUTH + PROFILE SYNC (NO UI CHANGE)
useEffect(() => {
  let isMounted = true;

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      if (!isMounted) return;

      const currentUser = session?.user ?? null;

      setUser(currentUser);
      setLoading(false);

      if (!currentUser) {
        router.replace("/login");
      }
    }
  );

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!isMounted) return;

    const currentUser = session?.user ?? null;

    setUser(currentUser);
    setLoading(false);

    if (!currentUser) {
      router.replace("/login");
    }
  });
const handleSave = async () => {
  if (!user) {
    alert("Login required ❌");
    return;
  }

  if (!name || !upi) {
    alert("Fill all fields ❌");
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      name,
      upi
    })
    .eq("id", user.id);

  if (error) {
    console.log(error);
    alert("Save failed ❌");
  } else {
    alert("Saved ✅");
  }
};
  return () => {
    isMounted = false;
    listener.subscription.unsubscribe();
  };
}, []);
  
  // ✅ KEEP ALL HOOKS ABOVE (IMPORTANT)
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
  useEffect(() => {
  const storedTask = localStorage.getItem("selectedTask");

  if (storedTask) {
    try {
      const parsed = JSON.parse(storedTask);

      setTimeout(() => {
        setSelectedTask(parsed);
        setChatOpen(true);
      }, 300);

    } catch (err) {
      console.log("Task restore error:", err);
    }
  }
}, []);

  // ✅ SAFE RENDER (after hooks)
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-lg">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center text-lg">
        Redirecting to login...
      </div>
    );
  }

  // ✅ UI (UNCHANGED)
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
  const load = async () => {
    const { data } = await supabase.from("tasks").select("*");
    setTasks(data || []);
  };

  load();
}, []);


  const user =
    JSON.parse(localStorage.getItem("gr_profile") || "{}").email || "guest";

  // ✅ GET LATEST SUBMISSION ONLY
  const getLatestRecord = (taskId) => {
    const subs = JSON.parse(localStorage.getItem("gr_submissions") || "[]");

    const records = subs
      .filter((s) => s.taskId === taskId && s.user === user)
      .sort((a, b) => b.id - a.id);

    return records[0];
  };

  // ✅ PURE STATUS (NO SIDE EFFECTS)
 const getStatus = (taskId) => {
  const subs = JSON.parse(localStorage.getItem("gr_submissions") || "[]");

  const record = subs
    .filter(s => s.taskId === taskId)
    .sort((a, b) => b.id - a.id)[0];

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
  
  const normal = tasks.filter((t) => t.type === "normal");
  const affiliate = tasks.filter(
    (t) => t.type === "affiliate" && t.subtype !== "ecommerce"
  );
  const ecommerce = tasks.filter(
    (t) => t.type === "affiliate" && t.subtype === "ecommerce"
  );

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button onClick={() => setTab("normal")}>Normal</Button>
        <Button onClick={() => setTab("affiliate")}>Affiliate</Button>
      </div>

      {tab === "affiliate" && (
        <div className="mb-4">
          <h3>E-commerce Offers</h3>
          <div className="grid grid-cols-3 gap-3">
            {ecommerce.map((t) => (
              <Card key={t.id} onClick={() => window.open(t.link)}>
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
        {(tab === "normal" ? normal : affiliate)
          .filter((t) => getStatus(t.id) !== "hide")
          .map((t) => {
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
                      onClick={() => {
                        if (isLocked) {
                          setPopupTask(status);
                          return;
                        }

                        // ✅ SAVE TASK BEFORE LEAVING
                        localStorage.setItem(
                          "selectedTask",
                          JSON.stringify(t)
                        );

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

                        // ✅ SAVE TASK
                        localStorage.setItem(
                          "selectedTask",
                          JSON.stringify(t)
                        );

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

            <Button className="mt-4" onClick={() => setPopupTask(null)}>
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
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user?.email || null);
    });
  }, []);

  // 🔥 FIXED UPLOAD FUNCTION
  const handleUpload = async (e) => {
    try {
      if (!selectedTask) {
        alert("No task selected ❌");
        return;
      }

      if (!user) {
        alert("Login required ❌");
        return;
      }

      const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
  alert("File too large (max 5MB) ❌");
  return;
}

      // ✅ Better file naming (user-wise folder)
    const fileName = `${user}/${Date.now()}-${file.name}`;

// upload
const { error } = await supabase.storage
  .from("screenshots")
  .upload(fileName, file);

if (error) {
  alert("Upload failed ❌");
  return;
}

// get URL
const { data } = supabase.storage
  .from("screenshots")
  .getPublicUrl(fileName);

const imageUrl = data.publicUrl;

// save in DB (FIXED)
const { data: sessionData } = await supabase.auth.getSession();
const currentUser = sessionData?.session?.user;

const { error: dbError } = await supabase
  .from("submissions")
  .insert([
    {
      user_id: currentUser?.id,
      task_name: selectedTask?.title,
      image_url: imageUrl,
      status: "pending"
    }
  ]);

if (dbError) {
  console.error("DB ERROR:", dbError);
  alert(dbError.message || "DB error ❌");
  return;
}

      // ✅ Success UI
      setChat((prev) => [
        ...prev,
        { text: "Screenshot uploaded ✅" },
      ]);
    } catch (err) {
      console.error("UNKNOWN ERROR:", err);
      alert("Something went wrong ❌");
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    setChat((prev) => [
      ...prev,
      { text: message },
      {
        text: selectedTask
          ? `Task: ${selectedTask.title}`
          : "Ask anything",
      },
    ]);

    setMessage("");
  };

  return (
    <div className="fixed bottom-20 right-6 w-80">
      <Card className="bg-white/40 backdrop-blur-xl shadow-lg">
        <CardContent className="p-4">
          
          <div className="flex justify-between mb-2">
            <span>Assistant</span>
            <X onClick={close} />
          </div>

          {selectedTask && (
            <p className="text-xs mb-2">
              Task: {selectedTask.title}
            </p>
          )}

          <div className="h-40 overflow-y-auto text-sm">
            {chat.map((c, i) => (
              <div key={i}>{c.text}</div>
            ))}
          </div>

          {/* ✅ Upload */}
          <input type="file" onChange={handleUpload} />

          <div className="flex gap-2 mt-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 border p-1"
            />
            <Button onClick={sendMessage}>Send</Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
// ---------------- Profile ----------------
function ProfilePage() {
  const [showWithdraw, setShowWithdraw] = useState(false);
const [withdrawAmount, setWithdrawAmount] = useState("");
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    upi: ""
  });

  const [balance, setBalance] = useState(0);

  useEffect(() => {
    setMounted(true);

    const loadUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;

      if (currentUser) {
        setUser(currentUser);

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        if (data) {
          setProfile(data);
          setForm({
            name: data.name || "",
            email: data.email || "",
            upi: data.upi || ""
          });
          setEditing(false);
          setBalance(data.wallet || 0);
        } else {
          setForm({
            name: currentUser.user_metadata?.full_name || "",
            email: currentUser.email || "",
            upi: ""
          });
        }
      }

      // fallback local wallet calc (kept same logic)
      const subs = JSON.parse(localStorage.getItem("gr_submissions") || "[]");
      const withdrawals = JSON.parse(localStorage.getItem("gr_withdrawals") || "[]");

      const approved = subs.filter(s => s.status === "approved");

      const totalEarn = approved.reduce((a, s) => a + (s.task?.reward || 0), 0);

      const totalWithdrawn = withdrawals
        .filter(w => w.status === "approved")
        .reduce((a, w) => a + w.amount, 0);

      setBalance(totalEarn - totalWithdrawn);
    };

    loadUser();
  }, []);

  if (!mounted) return null;

  const save = async () => {
    try {
      if (!form.name || !form.email || !form.upi) {
        alert("Fill all fields");
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;

      if (!currentUser) {
        alert("User not found ❌");
        return;
      }

      const { error } = await supabase.from("profiles").upsert([
        {
          id: currentUser.id,
          name: form.name,
          email: form.email,
          upi: form.upi,
          wallet: balance
        }
      ]);

      if (error) {
        console.error(error);
        alert("Save failed ❌");
        return;
      }

      alert("Saved ✅");

// ✅ UPDATE UI instantly
setProfile({
  name: form.name,
  email: form.email,
  upi: form.upi
});

setEditing(false);

    } catch (err) {
      console.error(err);
      alert("Error ❌");
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
<div 
  onClick={() => setShowWithdraw(true)}
  className="p-3 rounded-xl bg-green-100 text-green-800 font-semibold text-center cursor-pointer"
>
  Wallet Balance: ₹{balance} (Click to withdraw)
</div>
    {showWithdraw && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-5 rounded-xl w-80 space-y-3">

   <h3 className="font-semibold text-lg">Withdraw</h3>

<input
  type="number"
  placeholder="Enter amount"
  value={withdrawAmount}
  onChange={(e) => setWithdrawAmount(e.target.value)}
  className="w-full p-2 border rounded"
/>

<div className="flex gap-2">
  <Button
    className="w-full"
    onClick={async () => {
      const amt = Number(withdrawAmount);

      if (amt < 100) {
        alert("Minimum withdraw ₹100 ❌");
        return;
      }

      if (amt > balance) {
        alert("Insufficient balance ❌");
        return;
      }

      // 🔥 GET USER
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        alert("Login required ❌");
        return;
      }

      // 🔥 INSERT INTO DB
      const { error } = await supabase
        .from("withdrawals")
        .insert([
          {
            user_id: user.id,
            amount: amt,
            status: "pending"
          }
        ]);

      if (error) {
        console.error(error);
        alert("Request failed ❌");
        return;
      }

      alert("Withdrawal requested ✅");

      setShowWithdraw(false);
      setWithdrawAmount("");
    }}
  >
    Submit
  </Button>

  <Button variant="outline" onClick={() => setShowWithdraw(false)}>
    Cancel
  </Button>
</div>
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

            <input
              placeholder="UPI ID"
              value={form.upi}
              onChange={e => setForm({ ...form, upi: e.target.value })}
              className="w-full p-2 border rounded"
            />

            <Button className="w-full" onClick={save}>
              Save
            </Button>
          </>
        ) : (
          <>
            <h3 className="font-semibold text-lg">{profile?.name}</h3>
            <p>{profile?.email}</p>
            <p className="text-sm text-gray-600">
              UPI: {profile?.upi}
            </p>

            <div className="flex gap-2">
              <Button onClick={() => setEditing(true)}>Edit</Button>

              <Button
                className="bg-red-500 text-white"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/login";
                }}
              >
                Logout
              </Button>
            </div>
          </>
        )}

      </Card>
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
