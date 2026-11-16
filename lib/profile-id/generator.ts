import crypto from "crypto";

const MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec"
] as const;

/**
 * Normalizes a profile name into the first 5 uppercase alphanumeric characters.
 * If fewer than 5 characters exist, returns all available valid characters.
 */
export function normalizeNamePrefix(name: string): string {
  const alphanumeric = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (alphanumeric.length === 0) {
    return "VAST";
  }
  return alphanumeric.slice(0, 5);
}

/**
 * Formats a deterministic UTC timestamp as YYYYmmmDDHHmm (e.g. 2026nov162217).
 */
export function formatUtcTimestamp(date: Date = new Date()): string {
  const year = date.getUTCFullYear().toString();
  const month = MONTHS[date.getUTCMonth()];
  const day = date.getUTCDate().toString().padStart(2, "0");
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}`;
}

/**
 * Generates 3 cryptographically secure random lowercase characters from a-z.
 */
export function generateRandomSuffix(): string {
  let suffix = "";
  for (let i = 0; i < 3; i++) {
    const code = 97 + crypto.randomInt(0, 26);
    suffix += String.fromCharCode(code);
  }
  return suffix;
}

/**
 * Generates a candidate profile ID: FIRST5YYYYmmmDDHHmmxxx
 */
export function generateCandidateProfileId(name: string, date: Date = new Date()): string {
  const prefix = normalizeNamePrefix(name);
  const timestamp = formatUtcTimestamp(date);
  const suffix = generateRandomSuffix();
  return `${prefix}${timestamp}${suffix}`;
}

/**
 * Generates a collision-safe unique profile ID using the provided existence check.
 * Retries up to maxRetries if a collision occurs.
 */
export async function generateUniqueProfileId(
  name: string,
  checkExists: (id: string) => Promise<boolean>,
  date: Date = new Date(),
  maxRetries = 10
): Promise<string> {
  const prefix = normalizeNamePrefix(name);
  const timestamp = formatUtcTimestamp(date);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const suffix = generateRandomSuffix();
    const candidateId = `${prefix}${timestamp}${suffix}`;
    const exists = await checkExists(candidateId);
    if (!exists) {
      return candidateId;
    }
  }

  throw new Error(`Failed to generate a unique profile ID for "${name}" after ${maxRetries} attempts.`);
}
