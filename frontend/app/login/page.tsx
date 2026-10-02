"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent) {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed.");
      }

      // Store authentication information for now.
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Go to the main application.
      router.push("/");
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Unable to connect to the authentication server.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#08090c] text-white">
      <div className="flex min-h-screen items-center justify-center px-6 py-10">

        {/* Background glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/5 blur-3xl" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-red-600/5 blur-3xl" />
        </div>

        <section className="relative w-full max-w-md">

          {/* Header */}
          <div className="mb-6 text-center">

            {/* Arc Reactor */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-cyan-300 bg-cyan-400/10 shadow-[0_0_45px_rgba(34,211,238,0.5)]">

              <div className="h-9 w-9 rounded-full bg-cyan-300 shadow-[0_0_30px_rgba(103,232,249,1)]" />

            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.35em] text-red-500">
              ITFR SYSTEMS
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              System Login
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Authenticate to access the system
            </p>

          </div>

          {/* Login panel */}
          <div className="rounded-2xl border border-[#34363d] bg-[#111318] p-7 shadow-2xl">

            <div className="mb-6 flex items-center gap-3">

              <div className="h-3 w-3 rounded-full bg-[#f5c542] shadow-[0_0_12px_rgba(245,197,66,0.8)]" />

              <h2 className="font-bold">
                Authentication
              </h2>

            </div>

            <form onSubmit={handleLogin} className="space-y-5">

              {/* Email */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-300">
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  autoComplete="email"
                  className="w-full rounded-lg border border-[#3b3e46] bg-[#08090c] px-4 py-3 text-white placeholder-gray-600 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />

              </div>

              {/* Password */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-300">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-[#3b3e46] bg-[#08090c] px-4 py-3 text-white placeholder-gray-600 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />

              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
                  ⚠ {error}
                </div>
              )}

              {/* Login */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-red-700 to-red-500 px-5 py-3 font-bold text-white shadow-lg shadow-red-900/30 transition hover:from-red-600 hover:to-red-400 hover:shadow-red-700/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "AUTHENTICATING..." : "INITIATE LOGIN"}
              </button>

            </form>

            {/* Signup */}
            <div className="mt-6 border-t border-[#292c32] pt-6 text-center">

              <p className="text-sm text-gray-500">
                New system user?
              </p>

              <Link
                href="/signup"
                className="mt-2 inline-block text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
              >
                CREATE NEW ACCOUNT →
              </Link>

            </div>

          </div>

          {/* Footer */}
          <div className="mt-6 text-center">

            <p className="font-mono text-xs uppercase tracking-[0.25em] text-gray-600">
              ITFR SYSTEMS // SECURE ACCESS
            </p>

          </div>

        </section>

      </div>
    </main>
  );
}