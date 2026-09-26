import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AnimalCard } from "@/components/animals/AnimalCard";
import { calculateEstimatedNextHeat } from "@/lib/calculations/breeding";

const TABS = [
  { key: "all", label: "All" },
  { key: "cattle", label: "Cattle" },
  { key: "sheep", label: "Sheep" },
  { key: "goat", label: "Goats" },
  { key: "other", label: "Other" },
] as const;

export default async function AnimalsPage({
  searchParams,
}: {
  searchParams: Promise<{ species?: string; q?: string }>;
}) {
  const { species, q } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: farm } = await supabase.from("farms").select("id").eq("owner_id", user.id).single();
  if (!farm) redirect("/onboarding");

  let query = supabase
    .from("animals")
    .select(
      "id, tag_number, name, species, breed, sex, date_of_birth, weight_kg, photo_url, health_status, heat_cycle_days"
    )
    .eq("farm_id", farm.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  if (species && species !== "all") {
    if (species === "other") {
      query = query.in("species", ["pig", "poultry", "other"]);
    } else {
      query = query.eq(
        "species",
        species as "cattle" | "sheep" | "goat" | "pig" | "poultry" | "other"
      );
    }
  }
  if (q) {
    query = query.or(`tag_number.ilike.%${q}%,name.ilike.%${q}%,breed.ilike.%${q}%`);
  }

  const { data: animals } = await query;

  // Pull most recent heat date per animal for the "estimated next heat" hint on female cards.
  const animalIds = (animals ?? []).map((a) => a.id);
  const { data: recentHeats } = animalIds.length
    ? await supabase
        .from("breeding_records")
        .select("animal_id, heat_date")
        .in("animal_id", animalIds)
        .not("heat_date", "is", null)
        .order("heat_date", { ascending: false })
    : { data: [] as { animal_id: string; heat_date: string }[] };

  const lastHeatByAnimal = new Map<string, string>();
  for (const r of recentHeats ?? []) {
    if (!lastHeatByAnimal.has(r.animal_id)) lastHeatByAnimal.set(r.animal_id, r.heat_date);
  }

  return (
    <main className="min-h-screen bg-cream p-6 md:p-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold text-green-900">My Animals</h1>
        <Link href="/animals/new" className="bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
          + Add Animal
        </Link>
      </div>

      <form className="mt-4" action="/animals" method="get">
        {species && <input type="hidden" name="species" value={species} />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by ID, name, or breed…"
          className="w-full max-w-sm rounded-lg border border-green-200 px-3 py-2 text-sm text-green-900"
        />
      </form>

      <div className="flex gap-2 mt-4 flex-wrap">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/animals?species=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`px-4 py-1.5 rounded-full text-sm border ${
              (species ?? "all") === t.key
                ? "bg-green-700 text-white border-green-700"
                : "border-green-200 text-green-800"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {!animals || animals.length === 0 ? (
        <div className="mt-10 bg-white rounded-xl border border-green-100 p-10 text-center">
          <p className="text-green-800">No animals added yet.</p>
          <Link
            href="/animals/new"
            className="inline-block mt-4 bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
          >
            Add Your First Animal
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {animals.map((a) => {
            const lastHeat = lastHeatByAnimal.get(a.id);
            const estimate =
              a.sex === "female" && lastHeat
                ? calculateEstimatedNextHeat(new Date(lastHeat), a.species, a.heat_cycle_days)
                : null;
            return (
              <AnimalCard
                key={a.id}
                id={a.id}
                tagNumber={a.tag_number}
                name={a.name}
                species={a.species}
                breed={a.breed}
                sex={a.sex}
                dateOfBirth={a.date_of_birth}
                weightKg={a.weight_kg}
                healthStatus={a.health_status}
                photoUrl={a.photo_url}
                estimatedNextHeat={estimate?.estimatedDate?.toLocaleDateString() ?? null}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
