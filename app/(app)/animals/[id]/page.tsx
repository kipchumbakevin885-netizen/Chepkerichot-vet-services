import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateAnimalAge } from "@/lib/calculations/general";
import { calculateEstimatedNextHeat } from "@/lib/calculations/breeding";

const SPECIES_EMOJI: Record<string, string> = {
  cattle: "🐄",
  sheep: "🐑",
  goat: "🐐",
  pig: "🐖",
  poultry: "🐔",
  other: "🐾",
};

export default async function AnimalProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: animal } = await supabase.from("animals").select("*").eq("id", id).single();
  if (!animal) notFound();

  const { data: lastHeatRecord } = await supabase
    .from("breeding_records")
    .select("heat_date")
    .eq("animal_id", id)
    .not("heat_date", "is", null)
    .order("heat_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const estimate =
    animal.sex === "female" && lastHeatRecord?.heat_date
      ? calculateEstimatedNextHeat(new Date(lastHeatRecord.heat_date), animal.species, animal.heat_cycle_days)
      : null;

  const age = animal.date_of_birth ? calculateAnimalAge(new Date(animal.date_of_birth)) : "Unknown";

  return (
    <main className="min-h-screen bg-cream p-6 md:p-10">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{SPECIES_EMOJI[animal.species] ?? "🐾"}</span>
        <h1 className="text-2xl font-semibold text-green-900">
          {animal.tag_number}
          {animal.name ? ` · ${animal.name}` : ""}
        </h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-6">
        <div className="md:col-span-1">
          <div className="bg-green-50 rounded-xl h-56 flex items-center justify-center overflow-hidden">
            {animal.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={animal.photo_url} alt={`Photo of ${animal.tag_number}`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-6xl">{SPECIES_EMOJI[animal.species] ?? "🐾"}</span>
            )}
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl border border-green-100 p-6">
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <Info label="Species" value={animal.species} />
            <Info label="Breed" value={animal.breed ?? "—"} />
            <Info label="Sex" value={animal.sex} />
            <Info label="Age" value={age ?? "Unknown"} />
            <Info label="Weight" value={animal.weight_kg ? `${animal.weight_kg} kg` : "—"} />
            <Info label="Health" value={animal.health_status.replace("_", " ")} />
          </dl>
        </div>
      </div>

      <section className="mt-8 bg-white rounded-xl border border-green-100 p-6">
        <h2 className="font-semibold text-green-900 mb-3">Health Overview</h2>
        <dl className="grid md:grid-cols-2 gap-y-3 text-sm">
          <Info label="Current health status" value={animal.health_status.replace("_", " ")} />
          <Info label="Existing conditions" value={animal.existing_conditions ?? "None recorded"} />
          <Info label="Allergies" value={animal.allergies ?? "None recorded"} />
          <Info label="Special notes" value={animal.special_notes ?? "—"} />
        </dl>
      </section>

      {animal.sex === "female" && (
        <section className="mt-8 bg-white rounded-xl border border-green-100 p-6">
          <h2 className="font-semibold text-green-900 mb-2">Breeding</h2>
          {estimate?.estimatedDate ? (
            <>
              <p className="text-vet-blue font-medium">
                Estimated Next Heat: {estimate.estimatedDate.toLocaleDateString()}
              </p>
              <p className="text-xs text-green-700/60 mt-1">{estimate.basis}</p>
            </>
          ) : (
            <p className="text-sm text-green-700/70">No heat history recorded yet.</p>
          )}
        </section>
      )}
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-green-700/60">{label}</dt>
      <dd className="text-green-900 font-medium capitalize">{value}</dd>
    </div>
  );
}
