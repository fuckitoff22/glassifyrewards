"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminPanel() {
  const [page, setPage] = useState("dashboard");
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [suspendModal, setSuspendModal] = useState({ open:false, user:null, hours:"" });

  const [form, setForm] = useState({ title:"", link:"", reward:"", type:"normal", subtype:"", logo:null });

  useEffect(() => {
    const load = () => {
      setTasks(JSON.parse(localStorage.getItem("gr_tasks") || "[]"));
      setSubmissions(JSON.parse(localStorage.getItem("gr_submissions") || "[]"));
      setUsers(JSON.parse(localStorage.getItem("gr_users") || "[]"));
      setWithdrawals(JSON.parse(localStorage.getItem("gr_withdrawals") || "[]"));
    };
    load();
    const i = setInterval(load, 1000);
    return () => clearInterval(i);
  }, []);

  const saveTask = () => {
    if (!form.title) return;
    if (editingId) {
      const updated = tasks.map(t => t.id === editingId ? { ...t, ...form, reward:Number(form.reward) } : t);
      localStorage.setItem("gr_tasks", JSON.stringify(updated));
      setTasks(updated);
      setEditingId(null);
    } else {
      const newTask = { id: Date.now(), ...form, reward:Number(form.reward) };
      const updated = [...tasks, newTask];
      localStorage.setItem("gr_tasks", JSON.stringify(updated));
      setTasks(updated);
    }
    setForm({ title:"", link:"", reward:"", type:"normal", subtype:"", logo:null });
  };

  const editTask = (t) => {
    setForm(t);
    setEditingId(t.id);
    setPage("create");
  };

  const deleteTask = (id) => {
    const updated = tasks.filter(t=>t.id!==id);
    localStorage.setItem("gr_tasks", JSON.stringify(updated));
    setTasks(updated);
  };

  const handleSubmission = (id, status) => {
    let subs = JSON.parse(localStorage.getItem("gr_submissions") || "[]");
    let usersData = JSON.parse(localStorage.getItem("gr_users") || "[]");

    subs = subs.map(s => {
      if (s.id === id) {
        if (status === "approved") {
          const uIndex = usersData.findIndex(u => u.email === s.user);
          if (uIndex !== -1) usersData[uIndex].wallet += (s.task?.reward || 0);
        }
        return { ...s, status };
      }
      return s;
    });

    localStorage.setItem("gr_users", JSON.stringify(usersData));
    localStorage.setItem("gr_submissions", JSON.stringify(subs));
    setSubmissions(subs);
    setUsers(usersData);
  };

  const handleWithdraw = (id, status) => {
    let w = JSON.parse(localStorage.getItem("gr_withdrawals") || "[]");
    let usersData = JSON.parse(localStorage.getItem("gr_users") || "[]");

    w = w.map(req => {
      if (req.id === id) {
        const uIndex = usersData.findIndex(u => u.email === req.user);
        if (uIndex !== -1 && status === "rejected") usersData[uIndex].wallet += req.amount;
        return { ...req, status };
      }
      return req;
    });

    localStorage.setItem("gr_users", JSON.stringify(usersData));
    localStorage.setItem("gr_withdrawals", JSON.stringify(w));
    setWithdrawals(w);
    setUsers(usersData);
  };

  const ecommerceTasks = tasks.filter(t=>t.subtype==="ecommerce");
  const otherTasks = tasks.filter(t=>t.subtype!=="ecommerce");

  return (
    <div className="min-h-screen p-4 bg-white text-black">

      <div className="flex gap-2 mb-6 flex-wrap">
        <Button onClick={()=>setPage("dashboard")}>Dashboard</Button>
        <Button onClick={()=>setPage("create")}>Create Task</Button>
        <Button onClick={()=>setPage("manage-ecom")}>Ecommerce Tasks</Button>
        <Button onClick={()=>setPage("manage-other")}>Other Tasks</Button>
        <Button onClick={()=>setPage("users")}>Users</Button>
        <Button onClick={()=>setPage("submissions")}>Submissions</Button>
        <Button onClick={()=>setPage("payoff")}>Payoff</Button>
      </div>

      {/* DASHBOARD */}
      {page==="dashboard" && (
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4">Approved: {submissions.filter(s=>s.status==="approved").length}</CardContent></Card>
          <Card><CardContent className="p-4">Rejected: {submissions.filter(s=>s.status==="rejected").length}</CardContent></Card>
          <Card><CardContent className="p-4">Users: {users.length}</CardContent></Card>
        </div>
      )}

      {/* CREATE TASK */}
      {page==="create" && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6 space-y-3">
            <input className="w-full p-3 border" placeholder="Task Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
            <input className="w-full p-3 border" placeholder="Task Link" value={form.link} onChange={e=>setForm({...form,link:e.target.value})} />
            <input className="w-full p-3 border" placeholder="Reward" value={form.reward} onChange={e=>setForm({...form,reward:e.target.value})} />

            <select className="w-full p-3 border" value={form.type} onChange={e=>setForm({...form,type:e.target.value,subtype:e.target.value==="affiliate"?"ecommerce":""})}>
              <option value="normal">Normal</option>
              <option value="affiliate">Affiliate</option>
            </select>

            {form.type==="affiliate" && (
              <select className="w-full p-3 border" value={form.subtype} onChange={e=>setForm({...form,subtype:e.target.value})}>
                <option value="ecommerce">Ecommerce</option>
                <option value="general">General</option>
              </select>
            )}

            {form.subtype==="ecommerce" && (
              <div>
                <input type="file" onChange={e=>{
                  const reader=new FileReader();
                  reader.onload=()=>setForm(prev=>({...prev,logo:reader.result}));
                  reader.readAsDataURL(e.target.files[0]);
                }}/> 
                {form.logo && <img src={form.logo} className="w-12 mt-2" />}
              </div>
            )}

            <Button onClick={saveTask} className="w-full">
              {editingId ? "Update Task" : "Create Task"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ECOM TASKS */}
      {page==="manage-ecom" && (
        <div className="grid gap-3">
          {ecommerceTasks.map(t=> (
            <Card key={t.id}><CardContent className="p-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {t.logo && <img src={t.logo} className="w-8" />}
                <span>{t.title}</span>
              </div>
              <div className="flex gap-2">
                <Button onClick={()=>editTask(t)}>Edit</Button>
                <Button onClick={()=>deleteTask(t.id)}>Delete</Button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}

      {/* OTHER TASKS */}
      {page==="manage-other" && (
        <div className="grid gap-3">
          {otherTasks.map(t=> (
            <Card key={t.id}><CardContent className="p-3 flex justify-between">
              <span>{t.title}</span>
              <div className="flex gap-2">
                <Button onClick={()=>editTask(t)}>Edit</Button>
                <Button onClick={()=>deleteTask(t.id)}>Delete</Button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}

      {/* USERS */}
      {page==="users" && (
        <Card>
          <CardContent className="p-4">
            {users.map(u=> (
              <div key={u.email} className="border p-3 mb-3">
                <p className="font-semibold">{u.email}</p>
                <p>Wallet: ₹{u.wallet}</p>
                <p>Status: {u.status || "active"}</p>

                <div className="flex gap-2 mt-2 flex-wrap">
                  <Button onClick={()=>{
                    const amount = prompt("Enter new wallet amount");
                    if(amount!==null){
                      const updated = users.map(us=>us.email===u.email?{...us,wallet:Number(amount)}:us);
                      localStorage.setItem("gr_users",JSON.stringify(updated));
                      setUsers(updated);
                    }
                  }}>Edit Wallet</Button>

                  <Button onClick={()=>{
                    const hours = prompt("Ban for how many hours?");
                    if(hours){
                      const updated = users.map(us=>us.email===u.email?{
                        ...us,
                        status:"banned",
                        banUntil: Date.now() + hours*60*60*1000
                      }:us);
                      localStorage.setItem("gr_users",JSON.stringify(updated));
                      setUsers(updated);
                    }
                  }}>Ban</Button>

                  {/* Toggle Suspend */}
                  {u.status === "suspended" ? (
                    <Button onClick={()=>{
                      const updated = users.map(us=>us.email===u.email?{...us,status:"active"}:us);
                      localStorage.setItem("gr_users",JSON.stringify(updated));
                      setUsers(updated);
                    }}>Unsuspend</Button>
                  ) : (
                    <Button onClick={()=>setSuspendModal({ open:true, user:u, hours:"" })}>
                      Suspend
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Suspend Modal */}
            {suspendModal.open && (
              <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
                <div className="bg-white p-6 rounded shadow w-80">
                  <h3 className="mb-2 font-semibold">Suspend User</h3>
                  <p className="text-sm mb-2">User: {suspendModal.user?.email}</p>

                  <input
                    className="w-full p-2 border mb-3"
                    placeholder="Enter hours"
                    value={suspendModal.hours}
                    onChange={e=>setSuspendModal(prev=>({...prev,hours:e.target.value}))}
                  />

                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={()=>{
                      const hours = Number(suspendModal.hours);
                      if(!hours) return;

                      const updated = users.map(us=>us.email===suspendModal.user.email?{
                        ...us,
                        status:"suspended",
                        suspendUntil: Date.now() + hours*60*60*1000
                      }:us);

                      localStorage.setItem("gr_users",JSON.stringify(updated));
                      setUsers(updated);
                      setSuspendModal({ open:false, user:null, hours:"" });
                    }}>Confirm</Button>

                    <Button className="flex-1" onClick={()=>setSuspendModal({ open:false, user:null, hours:"" })}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
      )}
          </CardContent>
        </Card>
      )}

      {/* SUBMISSIONS */}
      {page==="submissions" && (
        <div className="grid gap-3">
          {submissions.filter(s=>s.status==="pending").map(s=> (
            <Card key={s.id}><CardContent className="p-3">
              <p className="font-semibold">{s.task?.title}</p>
              {s.img && (
                <a href={s.img} target="_blank" className="text-blue-600 underline">
                  View Screenshot
                </a>
              )}
              <p className="text-blue-600 cursor-pointer" onClick={()=>setPage("users")}>{s.user}</p>
              <p>₹{s.task?.reward}</p>
              <div className="flex gap-2 mt-2">
                <Button onClick={()=>handleSubmission(s.id,"approved")} className="flex-1">Approve</Button>
                <Button onClick={()=>handleSubmission(s.id,"rejected")} className="flex-1">Reject</Button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}

      {/* PAYOFF */}
      {page==="payoff" && (
        <Card>
          <CardContent className="p-4">
            {withdrawals.map(w=> (
              <div key={w.id} className="border p-3 mb-2">
                <p className="text-blue-600 cursor-pointer" onClick={()=>setPage("users")}>{w.user}</p>
                <p>Amount: ₹{w.amount}</p>
                <p>Status: {w.status}</p>
                {w.status==="pending" && (
                  <div className="flex gap-2 mt-2">
                    <Button className="flex-1" onClick={()=>handleWithdraw(w.id,"approved")}>Approve</Button>
                    <Button className="flex-1" onClick={()=>handleWithdraw(w.id,"rejected")}>Reject</Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
