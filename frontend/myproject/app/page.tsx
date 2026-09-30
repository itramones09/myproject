"use client";

import { useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
};

const API_URL = "http://localhost:8000";

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadUsers() {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/users`);

      if (!response.ok) {
        throw new Error("Failed to load users");
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
      setError("Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      setError("Please enter both name and email.");
      return;
    }

    try {
      setError("");

      const method = editingId === null ? "POST" : "PUT";

      const url =
        editingId === null
          ? `${API_URL}/users`
          : `${API_URL}/users/${editingId}`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save user");
      }

      setName("");
      setEmail("");
      setEditingId(null);

      await loadUsers();
    } catch (error) {
      console.error(error);
      setError("Unable to save user.");
    }
  }

  function handleEdit(user: User) {
    setEditingId(user.id);
    setName(user.name);
    setEmail(user.email);
    setError("");
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      await loadUsers();
    } catch (error) {
      console.error(error);
      setError("Unable to delete user.");
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setEmail("");
    setError("");
  }

  return (
    <main className="min-h-screen bg-[#08090c] text-white">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* HERO HEADER */}
        <section className="relative overflow-hidden rounded-2xl border border-red-900/60 bg-gradient-to-br from-[#17191f] via-[#0c0d10] to-[#090a0d] p-8 shadow-2xl shadow-red-950/30">

          {/* Arc reactor glow */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative flex items-center gap-5">

            {/* Reactor */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-cyan-300 bg-cyan-400/10 shadow-[0_0_35px_rgba(34,211,238,0.6)]">
              <div className="h-7 w-7 rounded-full bg-cyan-300 shadow-[0_0_25px_rgba(103,232,249,1)]" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-500">
                ITFR Systems
              </p>

              <h1 className="mt-1 text-4xl font-black tracking-tight">
                User Management
              </h1>

              <p className="mt-2 text-gray-400">
                MY Next.js + FastAPI CRUD Interface DEMO
              </p>
            </div>

          </div>
        </section>

        {/* ADD / EDIT */}
        <section className="mt-8 rounded-2xl border border-[#34363d] bg-[#111318] p-6 shadow-xl">

          <div className="mb-6 flex items-center gap-3">

            <div className="h-3 w-3 rounded-full bg-[#f5c542] shadow-[0_0_12px_rgba(245,197,66,0.8)]" />

            <h2 className="text-xl font-bold">
              {editingId === null
                ? "Deploy New User"
                : "Modify User"}
            </h2>

          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
          >

            <input
              type="text"
              placeholder="User Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-[#3b3e46] bg-[#08090c] px-4 py-3 text-white placeholder-gray-600 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-[#3b3e46] bg-[#08090c] px-4 py-3 text-white placeholder-gray-600 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />

            <div className="flex gap-2">

              <button
                type="submit"
                className="flex-1 rounded-lg bg-gradient-to-r from-red-700 to-red-500 px-5 py-3 font-bold text-white shadow-lg shadow-red-900/30 transition hover:from-red-600 hover:to-red-400 hover:shadow-red-700/30"
              >
                {editingId === null
                  ? "ADD USER"
                  : "UPDATE USER"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-lg border border-gray-600 px-5 py-3 text-gray-300 transition hover:bg-gray-800"
                >
                  CANCEL
                </button>
              )}

            </div>

          </form>

          {error && (
            <div className="mt-4 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
              ⚠ {error}
            </div>
          )}

        </section>

        {/* USERS */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-[#34363d] bg-[#111318] shadow-xl">

          <div className="flex items-center justify-between border-b border-[#292c32] p-6">

            <div>
              <h2 className="text-xl font-bold">
                User Database
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Active system users
              </p>
            </div>

            <div className="rounded-lg border border-[#f5c542]/30 bg-[#f5c542]/10 px-4 py-2 text-sm font-bold text-[#f5c542]">
              {users.length} USERS
            </div>

          </div>

          {loading ? (

            <div className="p-10 text-center text-gray-500">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-cyan-400" />
              Loading ITFR database...
            </div>

          ) : users.length === 0 ? (

            <div className="p-10 text-center text-gray-500">
              No users detected.
            </div>

          ) : (

            <div className="divide-y divide-[#292c32]">

              {users.map((user) => (

                <div
                  key={user.id}
                  className="flex flex-col gap-5 p-6 transition hover:bg-white/[0.02] md:flex-row md:items-center md:justify-between"
                >

                  <div className="flex items-center gap-4">

                    {/* User reactor */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-400/5 shadow-[0_0_15px_rgba(34,211,238,0.15)]">

                      <div className="h-4 w-4 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />

                    </div>

                    <div>

                      <h3 className="font-bold text-white">
                        {user.name}
                      </h3>

                      <p className="text-sm text-gray-400">
                        {user.email}
                      </p>

                      <p className="mt-1 font-mono text-xs text-gray-600">
                        USER_ID: {user.id}
                      </p>

                    </div>

                  </div>

                  <div className="flex gap-3">

                    <button
                      onClick={() => handleEdit(user)}
                      className="rounded-lg border border-[#f5c542]/60 px-5 py-2 text-sm font-bold text-[#f5c542] transition hover:bg-[#f5c542]/10"
                    >
                      EDIT
                    </button>

                    <button
                      onClick={() => handleDelete(user.id)}
                      className="rounded-lg border border-red-600/60 px-5 py-2 text-sm font-bold text-red-500 transition hover:bg-red-600/10"
                    >
                      DELETE
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* FOOTER */}
        <div className="mt-8 text-center">

          <p className="font-mono text-xs uppercase tracking-[0.25em] text-gray-600">
            ITFR SYSTEMS
          </p>

        </div>

      </div>
    </main>
  );
}


/* --------------------------------
   Endpoint Component
-------------------------------- */

function Endpoint({
  method,
  path,
}: {
  method: string;
  path: string;
}) {
  const colors: Record<string, string> = {
    GET: "text-green-400 border-green-500/30 bg-green-500/5",
    POST: "text-blue-400 border-blue-500/30 bg-blue-500/5",
    PUT: "text-yellow-400 border-yellow-500/30 bg-yellow-500/5",
    DELETE: "text-red-400 border-red-500/30 bg-red-500/5",
  };

  return (
    <div
      className={`rounded-lg border p-4 ${colors[method]}`}
    >
      <div className="font-mono text-xs font-bold">
        {method}
      </div>

      <div className="mt-1 font-mono text-sm text-gray-300">
        {path}
      </div>
    </div>
  );
}
