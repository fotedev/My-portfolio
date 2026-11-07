import { describe, expect, it } from "vitest";
import {
  contributionInputSchema,
  projectInputSchema,
  settingsInputSchema,
  slugify,
  validatePublish,
} from "./validation";

const validEn = {
  title: "Masar X",
  summary: "A production platform.",
  problem: "Legacy stack was slow.",
  solution: "Rebuilt on Next.js.",
  results: "3× faster.",
};

const validAr = {
  title: "مسار إكس",
  summary: "منصة إنتاجية.",
  problem: "كانت البنية القديمة بطيئة.",
  solution: "أُعيد البناء على Next.js.",
  results: "ثلاثة أضعاف أسرع.",
};

describe("slugify", () => {
  it("lowercases, strips diacritics, collapses separators", () => {
    expect(slugify("Ghost Scanner — v2")).toBe("ghost-scanner-v2");
    expect(slugify("  مسار Test ")).toBe("test");
    expect(slugify("ÁÉÎ_ÖÜ.file")).toBe("aei-ou-file");
  });

  it("emits DB-compatible slugs (^[a-z0-9]+(-[a-z0-9]+)*$)", () => {
    for (const raw of ["Hello World", "___x___", "a  b", "لغة English mix 42"]) {
      expect(slugify(raw)).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("caps length at 80 without dangling hyphens", () => {
    const slug = slugify(`${"word ".repeat(30)}!`);
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug).not.toMatch(/-$/);
  });
});

describe("validatePublish (R3 publish gate)", () => {
  const draft = { en_only: false, translations_ar: validAr };

  it("allows publish with an AR translation", () => {
    expect(validatePublish("project", draft, true)).toBeNull();
  });

  it("allows publish when only the OPTIONAL AR results field is empty", () => {
    const noResults = { ...validAr, results: "" };
    expect(validatePublish("project", { ...draft, translations_ar: noResults }, true)).toBeNull();
  });

  it("blocks publish without an AR translation", () => {
    expect(validatePublish("project", { ...draft, translations_ar: null }, true)).toMatch(
      /Arabic translation/i,
    );
  });

  it("blocks publish when a REQUIRED AR field is blank", () => {
    const blank = { ...validAr, summary: "   " };
    expect(validatePublish("project", { ...draft, translations_ar: blank }, true)).toMatch(
      /Arabic translation/i,
    );
  });

  it("skips the AR requirement for en_only rows", () => {
    expect(validatePublish("project", { ...draft, translations_ar: null, en_only: true }, true)).toBeNull();
  });

  it("never blocks draft saves", () => {
    expect(validatePublish("project", { ...draft, translations_ar: null }, false)).toBeNull();
  });

  it("credential gate requires issuer_display too", () => {
    const partial = { title: "T", issuer_display: "", summary: "S" };
    expect(validatePublish("credential", { ...draft, translations_ar: partial }, true)).toMatch(
      /Arabic translation/i,
    );
    expect(
      validatePublish(
        "credential",
        { ...draft, translations_ar: { title: "T", issuer_display: "I", summary: "S" } },
        true,
      ),
    ).toBeNull();
  });
});

describe("projectInputSchema", () => {
  const base = {
    slug: "masar-x",
    is_featured: true,
    en_only: false,
    sort_order: 1,
    tech_stack: ["Next.js", "Supabase"],
    repo_url: "",
    live_url: "https://masar.example.com",
    cover_asset_id: "",
    gallery: [],
    translations_en: validEn,
    translations_ar: validAr,
  };

  it("accepts a valid bilingual project", () => {
    const parsed = projectInputSchema.parse(base);
    expect(parsed.live_url).toBe("https://masar.example.com");
    expect(parsed.repo_url).toBeNull();
  });

  it("rejects invalid slugs", () => {
    for (const bad of ["Masar X", "masar--x", "-masar-", "مسار"]) {
      expect(() => projectInputSchema.parse({ ...base, slug: bad })).toThrow();
    }
  });

  it("rejects non-URL links", () => {
    expect(() => projectInputSchema.parse({ ...base, live_url: "not a url" })).toThrow();
  });
});

describe("contributionInputSchema", () => {
  const base = {
    repo: "vercel/next.js",
    number: 36490,
    kind: "pr",
    status: "merged",
    your_role: "Fix author",
    related_number: "",
    event_date: "2026-01-15",
    verification_date: "2026-02-01",
    proof_url: "https://github.com/vercel/next.js/pull/36490",
    sort_order: 0,
    is_published: true,
    translations_en: { title: "Fix X", summary: "Salvaged into #36490." },
    translations_ar: { title: "إصلاح", summary: "مدمج في #36490." },
  };

  it("accepts a valid contribution", () => {
    const parsed = contributionInputSchema.parse(base);
    expect(parsed.related_number).toBeNull();
    expect(parsed.event_date).toBe("2026-01-15");
  });

  it("requires owner/repo shape", () => {
    expect(() => contributionInputSchema.parse({ ...base, repo: "nextjs" })).toThrow();
  });

  it("requires the verification date (no invented claims)", () => {
    expect(() => contributionInputSchema.parse({ ...base, verification_date: "" })).toThrow();
  });
});

describe("settingsInputSchema", () => {
  const base = {
    contact_email: "hi@fotedev.me",
    availability_status: "available",
    cv_url: "",
    socials: [{ platform: "GitHub", url: "https://github.com/fotedev" }],
    translations_en: {
      hero_name: "Ahmed Aboalayoun",
      hero_role: "Full-Stack AI Engineer",
      hero_offer: "I build production AI systems.",
      availability_text: "Available for new projects",
    },
    translations_ar: {
      hero_name: "أحمد أبو العيون",
      hero_role: "مهندس ذكاء اصطناعي فول ستاك",
      hero_offer: "أبني أنظمة ذكاء اصطناعي إنتاجية.",
      availability_text: "متاح لمشاريع جديدة",
    },
  };

  it("accepts valid settings", () => {
    expect(settingsInputSchema.parse(base).availability_status).toBe("available");
  });

  it("rejects bad emails and malformed socials", () => {
    expect(() => settingsInputSchema.parse({ ...base, contact_email: "nope" })).toThrow();
    expect(() =>
      settingsInputSchema.parse({ ...base, socials: [{ platform: "X", url: "github.com" }] }),
    ).toThrow();
  });
});
