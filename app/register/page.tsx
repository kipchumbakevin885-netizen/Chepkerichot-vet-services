"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    farmName: "",
    county: "",
    subCounty: "",
    location: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName, phone: form.phone } },
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Registration failed.");
      setLoading(false);
      return;
    }

    // profiles row is created via the auth trigger (see 0003_profile_trigger.sql);
    // create the farm here since it needs form-specific fields.
    const { error: farmError } = await supabase.from("farms").insert({
      owner_id: data.user.id,
      farm_name: form.farmName,
      county: form.county,
      sub_county: form.subCounty,
      location: form.location,
    });

    setLoading(false);

    if (farmError) {
      setError(`Account created, but farm setup failed: ${farmError.message}`);
      return;
    }

    router.push("/onboarding");
  }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-green-100 p-8">
        <h1 className="text-2xl font-semibold text-green-900">Create your farmer account</h1>
        <p className="text-green-700/70 mt-1 text-sm">
          Vet Sambai Services — Smart Livestock Care.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Full name" value={form.fullName} onChange={update("fullName")} required />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone number" value={form.phone} onChange={update("phone")} required />
            <Field label="Email" type="email" value={form.email} onChange={update("email")} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Password" type="password" value={form.password} onChange={update("password")} required />
            <Field label="Confirm password" type="password" value={form.confirmPassword} onChange={update("confirmPassword")} required />
          </div>

          <hr className="my-2 border-green-100" />
          <Field label="Farm name" value={form.farmName} onChange={update("farmName")} required />
          <div className="grid grid-cols-2 gap-4">
            <Field label="County" value={form.county} onChange={update("county")} />
            <Field label="Sub-county" value={form.subCounty} onChange={update("subCounty")} />
          </div>
          <Field label="Location" value={form.location} onChange={update("location")} />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition"
          >
            {loading ? "Creating account…" : "Get Started"}
          </button>
        </form>

        <p className="text-sm text-green-700/70 mt-4 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-green-800 font-medium">
            Farmer Login
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  required,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-green-900">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="mt-1 w-full rounded-lg border border-green-200 px-3 py-2 text-sm text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </label>
  );
}
