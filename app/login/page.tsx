"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-green-100 p-8">
        <h1 className="text-2xl font-semibold text-green-900">Farmer Login</h1>
        <p className="text-green-700/70 mt-1 text-sm">Welcome back to Vet Sambai Services.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-green-900">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-green-200 px-3 py-2 text-sm text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-green-900">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-green-200 px-3 py-2 text-sm text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition"
          >
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>

        <div className="flex justify-between mt-4 text-sm">
          <Link href="/forgot-password" className="text-green-700/70">
            Forgot password?
          </Link>
          <Link href="/register" className="text-green-800 font-medium">
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}
