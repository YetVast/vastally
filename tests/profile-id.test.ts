import { describe, expect, it } from "vitest";
import {
  formatUtcTimestamp,
  generateCandidateProfileId,
  generateRandomSuffix,
  generateUniqueProfileId,
  normalizeNamePrefix,
} from "@/lib/profile-id/generator";

describe("Profile ID Generation Standard (FIRST5YYYYmmmDDHHmmxxx)", () => {
  it("normalizes name prefix correctly to 5 uppercase characters", () => {
    expect(normalizeNamePrefix("Yagnik Patel")).toBe("YAGNI");
    expect(normalizeNamePrefix("alice wonderland")).toBe("ALICE");
    expect(normalizeNamePrefix("John-Doe_123")).toBe("JOHND");
  });

  it("handles names with fewer than 5 characters gracefully", () => {
    expect(normalizeNamePrefix("Ali")).toBe("ALI");
    expect(normalizeNamePrefix("Bo")).toBe("BO");
    expect(normalizeNamePrefix("A")).toBe("A");
    expect(normalizeNamePrefix("   ")).toBe("VAST");
  });

  it("formats deterministic UTC timestamp as YYYYmmmDDHHmm", () => {
    // 2026-11-16 22:17 UTC
    const fixedDate = new Date(Date.UTC(2026, 10, 16, 22, 17, 45));
    const timestamp = formatUtcTimestamp(fixedDate);
    expect(timestamp).toBe("2026nov162217");
  });

  it("generates 3-character random lowercase suffix from a-z", () => {
    for (let i = 0; i < 50; i++) {
      const suffix = generateRandomSuffix();
      expect(suffix).toHaveLength(3);
      expect(suffix).toMatch(/^[a-z]{3}$/);
    }
  });

  it("generates candidate profile ID matching canonical specification", () => {
    const fixedDate = new Date(Date.UTC(2026, 10, 16, 22, 17, 0));
    const candidate = generateCandidateProfileId("Yagnik Patel", fixedDate);

    // Format: YAGNI (5) + 2026nov162217 (13) + 3 random chars (3) = 21 characters
    expect(candidate.startsWith("YAGNI2026nov162217")).toBe(true);
    expect(candidate).toHaveLength(21);
    expect(candidate).toMatch(/^YAGNI2026nov162217[a-z]{3}$/);
  });

  it("retries upon collision and generates a unique ID", async () => {
    const fixedDate = new Date(Date.UTC(2026, 10, 16, 22, 17, 0));
    const existing = new Set<string>();

    let calls = 0;
    const checkExists = async (id: string) => {
      calls++;
      // Simulate collision on first 2 attempts
      if (calls <= 2) {
        existing.add(id);
        return true;
      }
      return existing.has(id);
    };

    const uniqueId = await generateUniqueProfileId("Yagnik", checkExists, fixedDate, 10);
    expect(uniqueId).toMatch(/^YAGNI2026nov162217[a-z]{3}$/);
    expect(calls).toBe(3);
  });

  it("throws clear error if retry limit is exceeded", async () => {
    const checkExists = async () => true; // Always collides

    await expect(
      generateUniqueProfileId("Test", checkExists, new Date(), 3)
    ).rejects.toThrow(/Failed to generate a unique profile ID/);
  });
});
