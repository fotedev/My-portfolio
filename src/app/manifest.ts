import type { MetadataRoute } from "next";

// PWA manifest (M6 SEO audit finding: no manifest existed). The site is a
// portfolio, not an installable app — display is standalone-safe either way;
// icons are PNG renderings of src/app/icon.svg in public/icons/.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "fotedev — Ahmed Aboalayoun, Full-Stack AI Engineer",
    short_name: "fotedev",
    description: "Web applications and AI tools built around your business.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0E1A",
    theme_color: "#0A0E1A",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
