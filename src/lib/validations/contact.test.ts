import { describe, expect, it } from "vitest";
import { contactSchema } from "./contact";

const validBase = {
  name: "Test User",
  email: "test@example.com",
  serviceInterest: "web-apps",
  message: "I need a bilingual dashboard for my small business.",
  submissionToken: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  honeypot: "",
} as const;

describe("contactSchema", () => {
  it("accepts a valid submission", () => {
    const result = contactSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("accepts optional budget and timeline enums", () => {
    const result = contactSchema.safeParse({
      ...validBase,
      budgetRange: "1k-3k",
      timeline: "1-month",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a name shorter than 2 characters", () => {
    const result = contactSchema.safeParse({ ...validBase, name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = contactSchema.safeParse({ ...validBase, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects a message shorter than 20 characters", () => {
    const result = contactSchema.safeParse({ ...validBase, message: "too short" });
    expect(result.success).toBe(false);
  });

  it("rejects a message longer than 2000 characters", () => {
    const result = contactSchema.safeParse({ ...validBase, message: "x".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown service key", () => {
    const result = contactSchema.safeParse({ ...validBase, serviceInterest: "crypto-mining" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-UUID submission token", () => {
    const result = contactSchema.safeParse({ ...validBase, submissionToken: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects a filled honeypot (bot marker)", () => {
    const result = contactSchema.safeParse({ ...validBase, honeypot: "http://spam.example" });
    expect(result.success).toBe(false);
  });
});
