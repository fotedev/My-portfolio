import { describe, expect, it } from "vitest";
import { planRevalidation, tagsFor } from "./revalidate";

describe("planRevalidation", () => {
  it("project publish revalidates home, index, slug pages in both locales + sitemap", () => {
    const plan = planRevalidation("project", "khalat");
    expect(plan.paths).toEqual(
      expect.arrayContaining([
        "/en",
        "/ar",
        "/en/projects",
        "/ar/projects",
        "/en/projects/khalat",
        "/ar/projects/khalat",
      ]),
    );
    expect(plan.metadata).toEqual(["/sitemap.xml"]);
    expect(plan.layoutScopes).toEqual([]);
  });

  it("project plan tolerates a missing slug (bulk status flips)", () => {
    const plan = planRevalidation("project");
    expect(plan.paths.some((p) => p.includes("/projects/") && p !== "/en/projects" && p !== "/ar/projects")).toBe(
      false,
    );
  });

  it("service changes hit home + services pages, no sitemap", () => {
    const plan = planRevalidation("service");
    expect(plan.paths).toEqual(["/en", "/ar", "/en/services", "/ar/services"]);
    expect(plan.metadata).toEqual([]);
  });

  it("credentials and contributions hit home + about pages", () => {
    for (const kind of ["credential", "contribution"] as const) {
      expect(planRevalidation(kind).paths).toEqual(["/en", "/ar", "/en/about", "/ar/about"]);
    }
  });

  it("settings use layout scopes (footer/nav live in the locale layout)", () => {
    const plan = planRevalidation("settings");
    expect(plan.layoutScopes).toEqual(["/en", "/ar"]);
    expect(plan.paths).toEqual([]);
    expect(plan.metadata).toEqual(["/sitemap.xml"]);
  });

  it("media events revalidate nothing publicly (deletes of in-use assets are blocked)", () => {
    expect(planRevalidation("media")).toEqual({ paths: [], layoutScopes: [], tags: [], metadata: [] });
  });
});

describe("tagsFor", () => {
  it("matches the ARCHITECTURE §5.2 tag contract", () => {
    expect(tagsFor("project")).toEqual(["home", "projects:list", "project:slugs"]);
    expect(tagsFor("settings")).toEqual(["settings", "home"]);
    expect(tagsFor("media")).toEqual([]);
  });

  it("never returns tags outside the locked set", () => {
    const locked = new Set(["home", "projects:list", "project:slugs", "services", "settings", "credentials", "contributions"]);
    for (const kind of ["settings", "project", "service", "credential", "contribution", "media"] as const) {
      for (const tag of tagsFor(kind)) {
        expect(locked.has(tag)).toBe(true);
      }
    }
  });
});
