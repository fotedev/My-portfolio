import { describe, expect, it } from "vitest";
import { formatDate, formatYear, pickLocalized, statusPillKind } from "./localize";

describe("pickLocalized", () => {
  const rows = [
    { locale: "en", title: "English" },
    { locale: "ar", title: "عربي" },
  ];

  it("returns the requested locale's row", () => {
    expect(pickLocalized(rows, "ar")?.title).toBe("عربي");
    expect(pickLocalized(rows, "en")?.title).toBe("English");
  });

  it("falls back to EN when the requested locale is missing (never the reverse)", () => {
    const enOnly = [{ locale: "en", title: "English" }];
    expect(pickLocalized(enOnly, "ar")?.title).toBe("English");
  });

  it("returns null when no row exists at all", () => {
    expect(pickLocalized([], "en")).toBeNull();
    expect(pickLocalized([{ locale: "ar", title: "عربي" }], "en")).toBeNull();
  });
});

describe("statusPillKind — honesty mapping (CONTENT-MODEL §6)", () => {
  it("merged is success", () => {
    expect(statusPillKind("merged")).toBe("success");
  });

  it("acknowledged is warning (never 'fixed')", () => {
    expect(statusPillKind("acknowledged")).toBe("warning");
  });

  it("open stays neutral", () => {
    expect(statusPillKind("open")).toBe("neutral");
  });

  it("unknown statuses stay neutral, never dressed up", () => {
    expect(statusPillKind("closed")).toBe("neutral");
    expect(statusPillKind("")).toBe("neutral");
  });
});

describe("formatDate — Western digits in both locales (DESIGN §7.4)", () => {
  it("formats EN dates", () => {
    expect(formatDate("2026-11-07", "en")).toMatch(/2026/);
  });

  it("keeps Western digits on AR dates (latn numbering)", () => {
    const ar = formatDate("2026-11-07", "ar");
    expect(ar).toMatch(/2026/);
    expect(ar).not.toMatch(/[\u0660-\u0669]/); // no Arabic-Indic digits
  });
});

describe("formatYear", () => {
  it("renders plain Western digits without grouping", () => {
    expect(formatYear(2026)).toBe("2026");
  });
});
