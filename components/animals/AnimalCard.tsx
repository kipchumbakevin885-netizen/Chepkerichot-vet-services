import Link from "next/link";
import { calculateAnimalAge } from "@/lib/calculations/general";

const SPECIES_EMOJI: Record<string, string> = {
  cattle: "🐄",
  sheep: "🐑",
  goat: "🐐",
  pig: "🐖",
  poultry: "🐔",
  other: "🐾",
};

const STATUS_STYLES: Record<string, string> = {
  healthy: "bg-green-100 text-green-800",
  under_treatment: "bg-orange-100 text-orange-800",
  sick: "bg-red-100 text-red-800",
  deceased: "bg-gray-200 text-gray-700",
  sold: "bg-blue-100 text-blue-800",
};

export interface AnimalCardProps {
  id: string;
  tagNumber: string;
  name?: string | null;
  species: string;
  breed?: string | null;
  sex: string;
  dateOfBirth?: string | null;
  weightKg?: number | null;
  healthStatus: string;
  photoUrl?: string | null;
  estimatedNextHeat?: string | null;
}

export function AnimalCard({
  id,
  tagNumber,
  name,
  species,
  breed,
  sex,
  dateOfBirth,
  weightKg,
  healthStatus,
  photoUrl,
  estimatedNextHeat,
}: AnimalCardProps) {
  const age = dateOfBirth ? calculateAnimalAge(new Date(dateOfBirth)) : null;

  return (
    <div className="bg-white rounded-xl border border-green-100 overflow-hidden flex flex-col">
      <div className="h-36 bg-green-50 flex items-center justify-center overflow-hidden">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={`Photo of ${tagNumber}`} className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl">{SPECIES_EMOJI[species] ?? "🐾"}</span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-1 flex-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-green-900">{tagNumber}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[healthStatus] ?? "bg-gray-100 text-gray-700"}`}>
            {healthStatus.replace("_", " ")}
          </span>
        </div>
        {name && <p className="text-sm text-green-800">{name}</p>}
        <p className="text-sm text-green-700/70">
          {breed ?? "Unknown breed"} · {sex} {age ? `· ${age}` : ""}
        </p>
        {weightKg != null && <p className="text-sm text-green-700/70">{weightKg} kg</p>}
        {estimatedNextHeat && (
          <p className="text-xs text-vet-blue mt-1">Estimated next heat: {estimatedNextHeat}</p>
        )}

        <div className="mt-3 flex gap-2">
          <Link
            href={`/animals/${id}`}
            className="flex-1 text-center text-sm bg-green-700 text-white rounded-lg py-2"
          >
            View Profile
          </Link>
          <Link
            href={`/animals/${id}/edit`}
            className="flex-1 text-center text-sm border border-green-700 text-green-800 rounded-lg py-2"
          >
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}
