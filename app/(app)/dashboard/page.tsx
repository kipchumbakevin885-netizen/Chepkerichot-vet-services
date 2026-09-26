import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateReminderStatus, type ReminderStatus } from "@/lib/calculations/general";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: farm } = await supabase
    .from("farms")
    .select("id, farm_name")
    .eq("owner_id", user.id)
    .single();

  if (!farm) redirect("/onboarding");

  const { data: animals } = await supabase
    .from("animals")
    .select("id, species, health_status")
    .eq("farm_id", farm.id)
    .eq("is_archived", false);

  const { data: reminders } = await supabase
    .from("reminders")
    .select("id, title, due_date, priority, status, animal_id")
    .eq("farm_id", farm.id)
    .order("due_date", { ascending: true })
    .limit(10);

  const counts = { cattle: 0, sheep: 0, goat: 0, pig: 0, poultry: 0, other: 0 } as Record<string, number>;
  let healthy = 0;
  let underTreatment = 0;
  for (const a of animals ?? []) {
    counts[a.species] = (counts[a.species] ?? 0) + 1;
    if (a.health_status === "healthy") healthy += 1;
    if (a.health_status === "under_treatment") underTreatment += 1;
  }

  const todaysReminders = (reminders ?? []).filter(
    (r) => calculateReminderStatus(new Date(r.due_date), r.status as ReminderStatus) !== "completed"
  );

  return (
    <main className="min-h-screen bg-cream p-6 md:p-10">
      <header>
        <h1 className="text-2xl font-semibold text-green-900">
          Good morning, {profile?.full_name?.split(" ")[0] ?? "Farmer"} 👋
        </h1>
        <p className="text-green-700/70 mt-1">Here is what&apos;s happening on your farm today.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        <StatCard label="🐄 Cattle" value={counts.cattle} />
        <StatCard label="🐑 Sheep" value={counts.sheep} />
        <StatCard label="🐐 Goats" value={counts.goat} />
        <StatCard label="Healthy" value={healthy} />
        <StatCard label="Under Treatment" value={underTreatment} />
        <StatCard label="Total Animals" value={(animals ?? []).length} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-green-900 mb-3">Today&apos;s Reminders</h2>
        {todaysReminders.length === 0 ? (
          <EmptyState message="You're all caught up 🎉" />
        ) : (
          <ul className="space-y-2">
            {todaysReminders.map((r) => (
              <li
                key={r.id}
                className="bg-white rounded-xl border border-green-100 px-4 py-3 flex items-center justify-between"
              >
                <span className="text-sm text-green-900">{r.title}</span>
                <span className="text-xs text-green-700/60">{r.due_date}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-green-100 p-4">
      <p className="text-sm text-green-700/70">{label}</p>
      <p className="text-2xl font-semibold text-green-900 mt-1">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-xl border border-green-100 p-6 text-center text-green-700/70">
      {message}
    </div>
  );
}
