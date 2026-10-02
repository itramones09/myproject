"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:8000";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(e: FormEvent) {
    e.preventDefault();

    setError("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to create account.");
      }

      // Account created.
      // Send user to login.
      router.push("/login");

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

        {/* Background */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-red-600/5 blur-3xl" />

          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-400/5 blur-3xl" />
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
              Create Account
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Initialize a new system identity
            </p>

          </div>

          {/* Signup panel */}
          <div className="rounded-2xl border border-[#34363d] bg-[#111318] p-7 shadow-2xl">

            <div className="mb-6 flex items-center gap-3">

              <div className="h-3 w-3 rounded-full bg-[#f5c542] shadow-[0_0_12px_rgba(245,197,66,0.8)]" />

              <h2 className="font-bold">
                User Registration
              </h2>

            </div>

            <form onSubmit={handleSignup} className="space-y-5">

              {/* Name */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-300">
                  User Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  className="w-full rounded-lg border border-[#3b3e46] bg-[#08090c] px-4 py-3 text-white placeholder-gray-600 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />

              </div>

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
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-[#3b3e46] bg-[#08090c] px-4 py-3 text-white placeholder-gray-600 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />

              </div>

              {/* Confirm password */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-300">
                  Confirm Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-[#3b3e46] bg-[#08090c] px-4 py-3 text-white placeholder-gray-600 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />

              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
                  ⚠ {error}
                </div>
              )}

              {/* Signup */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-red-700 to-red-500 px-5 py-3 font-bold text-white shadow-lg shadow-red-900/30 transition hover:from-red-600 hover:to-red-400 hover:shadow-red-700/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "INITIALIZING..."
                  : "CREATE ACCOUNT"}
              </button>

            </form>

            {/* Login */}
            <div className="mt-6 border-t border-[#292c32] pt-6 text-center">

              <p className="text-sm text-gray-500">
                Already registered?
              </p>

              <Link
                href="/login"
                className="mt-2 inline-block text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
              >
                RETURN TO LOGIN →
              </Link>

            </div>

          </div>

          {/* Footer */}
          <div className="mt-6 text-center">

            <p className="font-mono text-xs uppercase tracking-[0.25em] text-gray-600">
              ITFR SYSTEMS // REGISTRATION PROTOCOL
            </p>

          </div>

        </section>

      </div>
    </main>
  );
}