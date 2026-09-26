"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SPECIES_OPTIONS = [
  { value: "cattle", label: "🐄 Cattle" },
  { value: "sheep", label: "🐑 Sheep" },
  { value: "goat", label: "🐐 Goat" },
  { value: "pig", label: "🐖 Pig" },
  { value: "poultry", label: "🐔 Poultry" },
  { value: "other", label: "Other" },
] as const;

export default function AddAnimalPage() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    tagNumber: "",
    name: "",
    species: "cattle" as (typeof SPECIES_OPTIONS)[number]["value"],
    breed: "",
    sex: "female" as "male" | "female",
    dateOfBirth: "",
    colorMarkings: "",
    weightKg: "",
    bodyConditionScore: "",
    healthStatus: "healthy" as "healthy" | "under_treatment" | "sick",
    existingConditions: "",
    allergies: "",
    specialNotes: "",
    lastHeatDate: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value as never }));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expired — please log in again.");
      setLoading(false);
      return;
    }

    const { data: farm, error: farmError } = await supabase
      .from("farms")
      .select("id")
      .eq("owner_id", user.id)
      .single();
    if (farmError || !farm) {
      setError("Could not find your farm.");
      setLoading(false);
      return;
    }

    const { data: animal, error: insertError } = await supabase
      .from("animals")
      .insert({
        farm_id: farm.id,
        tag_number: form.tagNumber,
        name: form.name || null,
        species: form.species,
        breed: form.breed || null,
        sex: form.sex,
        date_of_birth: form.dateOfBirth || null,
        color_markings: form.colorMarkings || null,
        weight_kg: form.weightKg ? Number(form.weightKg) : null,
        body_condition_score: form.bodyConditionScore ? Number(form.bodyConditionScore) : null,
        health_status: form.healthStatus,
        existing_conditions: form.existingConditions || null,
        allergies: form.allergies || null,
        special_notes: form.specialNotes || null,
      })
      .select("id")
      .single();

    if (insertError || !animal) {
      setError(insertError?.message ?? "Could not save this animal.");
      setLoading(false);
      return;
    }

    // Upload photo, if provided, then attach its public URL to the animal row.
    if (photoFile) {
      const path = `${farm.id}/${animal.id}/${Date.now()}-${photoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("animal-photos")
        .upload(path, photoFile);

      if (!uploadError) {
        const { data: publicUrl } = supabase.storage.from("animal-photos").getPublicUrl(path);
        await supabase.from("animals").update({ photo_url: publicUrl.publicUrl }).eq("id", animal.id);
      }
      // A failed photo upload doesn't block animal creation — the farmer can add
      // a photo later from the animal's profile/edit page.
    }

    // Record the initial heat date, if given, so estimated-next-heat has a basis.
    if (form.sex === "female" && form.lastHeatDate) {
      await supabase.from("breeding_records").insert({
        animal_id: animal.id,
        heat_date: form.lastHeatDate,
      });
    }

    setLoading(false);
    router.push(`/animals/${animal.id}`);
  }

  return (
    <main className="min-h-screen bg-cream p-6 md:p-10">
      <h1 className="text-2xl font-semibold text-green-900">Add Animal</h1>

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl bg-white rounded-2xl border border-green-100 p-6 space-y-6">
        <section>
          <h2 className="font-medium text-green-900 mb-3">Identification</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Animal ID / tag number" value={form.tagNumber} onChange={update("tagNumber")} required />
            <Field label="Animal name" value={form.name} onChange={update("name")} />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <SelectField label="Species" value={form.species} onChange={update("species")} options={SPECIES_OPTIONS} />
            <Field label="Breed" value={form.breed} onChange={update("breed")} />
            <SelectField
              label="Sex"
              value={form.sex}
              onChange={update("sex")}
              options={[
                { value: "female", label: "Female" },
                { value: "male", label: "Male" },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Field label="Date of birth" type="date" value={form.dateOfBirth} onChange={update("dateOfBirth")} />
            <Field label="Color / markings" value={form.colorMarkings} onChange={update("colorMarkings")} />
          </div>
        </section>

        <section>
          <h2 className="font-medium text-green-900 mb-3">Physical information</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Weight (kg)" type="number" value={form.weightKg} onChange={update("weightKg")} />
            <Field
              label="Body condition score (1–5)"
              type="number"
              value={form.bodyConditionScore}
              onChange={update("bodyConditionScore")}
            />
          </div>
        </section>

        <section>
          <h2 className="font-medium text-green-900 mb-3">Photo</h2>
          <input type="file" accept="image/*" onChange={handlePhotoChange} className="text-sm" />
          {photoPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="Preview" className="mt-3 h-32 w-32 object-cover rounded-lg" />
          )}
        </section>

        <section>
          <h2 className="font-medium text-green-900 mb-3">Health</h2>
          <SelectField
            label="Current health status"
            value={form.healthStatus}
            onChange={update("healthStatus")}
            options={[
              { value: "healthy", label: "Healthy" },
              { value: "under_treatment", label: "Under treatment" },
              { value: "sick", label: "Sick" },
            ]}
          />
          <TextAreaField label="Existing conditions" value={form.existingConditions} onChange={update("existingConditions")} />
          <TextAreaField label="Allergies" value={form.allergies} onChange={update("allergies")} />
          <TextAreaField label="Special notes" value={form.specialNotes} onChange={update("specialNotes")} />
        </section>

        {form.sex === "female" && (
          <section>
            <h2 className="font-medium text-green-900 mb-3">Breeding</h2>
            <Field label="Last heat date (if known)" type="date" value={form.lastHeatDate} onChange={update("lastHeatDate")} />
            <p className="text-xs text-green-700/60 mt-1">
              Used to calculate an estimated next heat — always shown as an estimate, never a guarantee.
            </p>
          </section>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition"
        >
          {loading ? "Saving…" : "Save Animal"}
        </button>
      </form>
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

function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-green-900">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className="mt-1 w-full rounded-lg border border-green-200 px-3 py-2 text-sm text-green-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <label className="block mt-3">
      <span className="text-sm font-medium text-green-900">{label}</span>
      <textarea
        value={value}
        onChange={onChange}
        rows={2}
        className="mt-1 w-full rounded-lg border border-green-200 px-3 py-2 text-sm text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </label>
  );
}
