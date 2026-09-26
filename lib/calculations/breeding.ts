import { addDays, differenceInCalendarDays } from "date-fns";

export type Species = "cattle" | "sheep" | "goat" | "pig" | "poultry" | "other";

/** Default assumptions — mirror supabase/migrations/0001_init.sql species_breeding_defaults. */
export const SPECIES_BREEDING_DEFAULTS: Record<Species, { heatCycleDays: number | null; gestationDays: number | null }> = {
  cattle: { heatCycleDays: 21, gestationDays: 283 },
  sheep: { heatCycleDays: 17, gestationDays: 152 },
  goat: { heatCycleDays: 21, gestationDays: 150 },
  pig: { heatCycleDays: 21, gestationDays: 114 },
  poultry: { heatCycleDays: null, gestationDays: null },
  other: { heatCycleDays: null, gestationDays: null },
};

export interface EstimatedNextHeatResult {
  estimatedDate: Date | null;
  cycleDaysUsed: number | null;
  isEstimate: true;
  basis: string;
}

/**
 * Estimated next heat date, derived from the last recorded heat date and
 * a cycle length. This is NEVER a guarantee — always label it "Estimated"
 * in the UI and show the basis string alongside it.
 *
 * @param lastHeatDate - most recent recorded heat date
 * @param species - used to look up a default cycle length if none is given
 * @param overrideCycleDays - a farmer/vet-configured cycle length, takes priority
 */
export function calculateEstimatedNextHeat(
  lastHeatDate: Date | null,
  species: Species,
  overrideCycleDays?: number | null
): EstimatedNextHeatResult {
  const cycleDaysUsed = overrideCycleDays ?? SPECIES_BREEDING_DEFAULTS[species].heatCycleDays;

  if (!lastHeatDate || !cycleDaysUsed) {
    return {
      estimatedDate: null,
      cycleDaysUsed,
      isEstimate: true,
      basis: "Insufficient heat history to estimate — record a heat date to enable this.",
    };
  }

  return {
    estimatedDate: addDays(lastHeatDate, cycleDaysUsed),
    cycleDaysUsed,
    isEstimate: true,
    basis: `Based on the last recorded heat date and a ${cycleDaysUsed}-day cycle assumption for this animal/species.`,
  };
}

export interface ExpectedBirthResult {
  expectedDate: Date | null;
  gestationDaysUsed: number | null;
  isEstimate: true;
  basis: string;
}

/**
 * Expected calving/lambing/farrowing date from a confirmed service/breeding date.
 * Labeled as an estimate — actual gestation length varies by animal.
 */
export function calculateExpectedBirth(
  serviceDate: Date | null,
  species: Species,
  overrideGestationDays?: number | null
): ExpectedBirthResult {
  const gestationDaysUsed = overrideGestationDays ?? SPECIES_BREEDING_DEFAULTS[species].gestationDays;

  if (!serviceDate || !gestationDaysUsed) {
    return {
      expectedDate: null,
      gestationDaysUsed,
      isEstimate: true,
      basis: "No confirmed service/breeding date on file, or no gestation assumption for this species.",
    };
  }

  return {
    expectedDate: addDays(serviceDate, gestationDaysUsed),
    gestationDaysUsed,
    isEstimate: true,
    basis: `Based on the service date and a ${gestationDaysUsed}-day gestation assumption for this species.`,
  };
}

/** Days pregnant so far, or null if there's no confirmed service date. */
export function calculateDaysPregnant(serviceDate: Date | null, today: Date = new Date()): number | null {
  if (!serviceDate) return null;
  const days = differenceInCalendarDays(today, serviceDate);
  return days >= 0 ? days : null;
}
