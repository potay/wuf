/**
 * Breed-specific growth data for puppy weight projection.
 * Adult weight ranges in lbs. Growth duration in months to ~95% of adult weight.
 */

export type SizeCategory = "toy" | "small" | "medium" | "large" | "giant";

export interface SizePrior {
  category: SizeCategory;
  /** Typical adult weight range in lbs */
  adultWeightLbs: { min: number; max: number };
  /** Typical age in months to reach ~95% of adult weight */
  monthsToFullGrown: number;
}

export const SIZE_PRIORS: Record<SizeCategory, SizePrior> = {
  toy: { category: "toy", adultWeightLbs: { min: 4, max: 12 }, monthsToFullGrown: 9 },
  small: { category: "small", adultWeightLbs: { min: 12, max: 25 }, monthsToFullGrown: 11 },
  medium: { category: "medium", adultWeightLbs: { min: 25, max: 60 }, monthsToFullGrown: 13 },
  large: { category: "large", adultWeightLbs: { min: 60, max: 100 }, monthsToFullGrown: 16 },
  giant: { category: "giant", adultWeightLbs: { min: 100, max: 200 }, monthsToFullGrown: 22 },
};

interface BreedEntry {
  /** Breed name (lowercase, used for matching) */
  name: string;
  /** Aliases / common spellings */
  aliases?: string[];
  category: SizeCategory;
  /** Override the size prior with breed-specific values */
  adultWeightLbs?: { min: number; max: number };
  monthsToFullGrown?: number;
}

const BREEDS: BreedEntry[] = [
  // Toy
  { name: "chihuahua", category: "toy", adultWeightLbs: { min: 3, max: 7 } },
  { name: "yorkshire terrier", aliases: ["yorkie"], category: "toy", adultWeightLbs: { min: 4, max: 7 } },
  { name: "maltese", category: "toy", adultWeightLbs: { min: 4, max: 8 } },
  { name: "pomeranian", category: "toy", adultWeightLbs: { min: 3, max: 7 } },
  { name: "shih tzu", category: "toy", adultWeightLbs: { min: 9, max: 16 } },
  { name: "papillon", category: "toy", adultWeightLbs: { min: 5, max: 10 } },

  // Small
  { name: "cavalier king charles spaniel", aliases: ["cavalier"], category: "small", adultWeightLbs: { min: 13, max: 18 } },
  { name: "beagle", category: "small", adultWeightLbs: { min: 20, max: 30 } },
  { name: "dachshund", category: "small", adultWeightLbs: { min: 16, max: 32 } },
  { name: "cocker spaniel", category: "small", adultWeightLbs: { min: 20, max: 30 } },
  { name: "french bulldog", aliases: ["frenchie"], category: "small", adultWeightLbs: { min: 16, max: 28 } },
  { name: "jack russell terrier", aliases: ["jack russell"], category: "small", adultWeightLbs: { min: 13, max: 17 } },
  { name: "boston terrier", category: "small", adultWeightLbs: { min: 12, max: 25 } },
  { name: "pug", category: "small", adultWeightLbs: { min: 14, max: 18 } },
  { name: "cockapoo", category: "small", adultWeightLbs: { min: 12, max: 25 } },
  { name: "miniature schnauzer", category: "small", adultWeightLbs: { min: 11, max: 20 } },

  // Medium
  { name: "border collie", category: "medium", adultWeightLbs: { min: 30, max: 55 } },
  { name: "australian shepherd", aliases: ["aussie", "aussie shepherd"], category: "medium", adultWeightLbs: { min: 40, max: 65 } },
  { name: "aussiedoodle", aliases: ["aussie doodle", "aussiepoo"], category: "medium", adultWeightLbs: { min: 25, max: 70 }, monthsToFullGrown: 14 },
  { name: "shiba inu", category: "medium", adultWeightLbs: { min: 17, max: 23 } },
  { name: "bulldog", category: "medium", adultWeightLbs: { min: 40, max: 50 } },
  { name: "cocker spaniel", category: "medium", adultWeightLbs: { min: 20, max: 30 } },
  { name: "siberian husky", aliases: ["husky"], category: "medium", adultWeightLbs: { min: 35, max: 60 } },
  { name: "schnauzer", category: "medium", adultWeightLbs: { min: 30, max: 50 } },

  // Large
  { name: "labrador retriever", aliases: ["lab", "labrador"], category: "large", adultWeightLbs: { min: 55, max: 80 } },
  { name: "golden retriever", aliases: ["golden"], category: "large", adultWeightLbs: { min: 55, max: 75 } },
  { name: "german shepherd", aliases: ["gsd"], category: "large", adultWeightLbs: { min: 50, max: 90 } },
  { name: "goldendoodle", aliases: ["golden doodle"], category: "large", adultWeightLbs: { min: 30, max: 90 }, monthsToFullGrown: 16 },
  { name: "labradoodle", aliases: ["labra doodle"], category: "large", adultWeightLbs: { min: 30, max: 90 }, monthsToFullGrown: 16 },
  { name: "bernese mountain dog", aliases: ["berner"], category: "large", adultWeightLbs: { min: 70, max: 115 }, monthsToFullGrown: 18 },
  { name: "boxer", category: "large", adultWeightLbs: { min: 55, max: 75 } },
  { name: "doberman pinscher", aliases: ["doberman", "dobie"], category: "large", adultWeightLbs: { min: 60, max: 100 } },
  { name: "rottweiler", category: "large", adultWeightLbs: { min: 80, max: 135 }, monthsToFullGrown: 18 },
  { name: "vizsla", category: "large", adultWeightLbs: { min: 45, max: 65 } },
  { name: "weimaraner", category: "large", adultWeightLbs: { min: 55, max: 90 } },
  { name: "standard poodle", aliases: ["poodle"], category: "large", adultWeightLbs: { min: 40, max: 70 } },

  // Giant
  { name: "great dane", category: "giant", adultWeightLbs: { min: 110, max: 175 } },
  { name: "saint bernard", aliases: ["st bernard"], category: "giant", adultWeightLbs: { min: 120, max: 180 } },
  { name: "newfoundland", category: "giant", adultWeightLbs: { min: 100, max: 150 } },
  { name: "mastiff", category: "giant", adultWeightLbs: { min: 120, max: 230 } },
  { name: "great pyrenees", category: "giant", adultWeightLbs: { min: 85, max: 115 } },
  { name: "irish wolfhound", category: "giant", adultWeightLbs: { min: 105, max: 180 } },
];

export interface BreedPrior {
  /** Match quality */
  matched: boolean;
  /** Original breed string the user entered */
  rawBreed: string;
  /** Matched breed name if found */
  matchedName?: string;
  category: SizeCategory;
  /** Adult weight range in lbs */
  adultWeightLbs: { min: number; max: number };
  /** Mean adult weight (geometric mean of range) */
  meanAdultWeightLbs: number;
  /** Months to ~95% of adult weight */
  monthsToFullGrown: number;
}

/** Look up breed-specific priors. Returns size-category default if no exact match. */
export function getBreedPrior(breed: string | null | undefined): BreedPrior {
  const raw = (breed || "").trim();
  const normalized = raw.toLowerCase();

  if (normalized) {
    // Try exact match by name or aliases
    let match = BREEDS.find(b =>
      b.name === normalized ||
      (b.aliases || []).includes(normalized)
    );

    // Fall back to substring match (e.g., "golden retriever puppy" -> "golden retriever")
    if (!match) {
      match = BREEDS.find(b =>
        normalized.includes(b.name) ||
        (b.aliases || []).some(a => normalized.includes(a))
      );
    }

    if (match) {
      const sizePrior = SIZE_PRIORS[match.category];
      const range = match.adultWeightLbs || sizePrior.adultWeightLbs;
      return {
        matched: true,
        rawBreed: raw,
        matchedName: match.name,
        category: match.category,
        adultWeightLbs: range,
        meanAdultWeightLbs: Math.sqrt(range.min * range.max),
        monthsToFullGrown: match.monthsToFullGrown ?? sizePrior.monthsToFullGrown,
      };
    }
  }

  // No match - default to medium
  const def = SIZE_PRIORS.medium;
  return {
    matched: false,
    rawBreed: raw,
    category: def.category,
    adultWeightLbs: def.adultWeightLbs,
    meanAdultWeightLbs: Math.sqrt(def.adultWeightLbs.min * def.adultWeightLbs.max),
    monthsToFullGrown: def.monthsToFullGrown,
  };
}
