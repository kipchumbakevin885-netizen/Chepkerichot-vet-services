import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold text-green-900">Welcome to Vet Sambai Services</h1>
        <p className="mt-3 text-green-700/70">
          Your account and farm are set up. Livestock selection and adding your first animal
          land in Phase 2 — for now, head to your dashboard.
        </p>
        <Link
          href="/dashboard"
          className="inline-block mt-6 bg-green-700 text-white px-6 py-3 rounded-xl font-medium"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
