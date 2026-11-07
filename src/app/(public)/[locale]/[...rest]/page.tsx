import { notFound } from "next/navigation";

/** Locale-scoped catch-all: any unknown path under /en or /ar 404s. */
export default function CatchAllPage() {
  notFound();
}
