import "server-only";
import { revalidatePath, updateTag } from "next/cache";
import { planRevalidation, type RevalidateKind } from "./revalidate";

/**
 * Executes the revalidation plan after an admin write (server-side only).
 * Paths are the effective tool (route-level ISR, no fetch cache tags today);
 * `updateTag` (Next 16's action-context tag expiration — immediate,
 * read-your-own-writes) keeps the ARCHITECTURE §5.2 tag contract honored
 * if/when tagged reads land.
 */
export function revalidateContent(kind: RevalidateKind, slugs: string[] = []): void {
  const plans = [planRevalidation(kind), ...slugs.map((slug) => planRevalidation(kind, slug))];
  for (const plan of plans) {
    for (const path of plan.paths) {
      revalidatePath(path);
    }
    for (const scope of plan.layoutScopes) {
      revalidatePath(scope, "layout");
    }
    for (const meta of plan.metadata) {
      revalidatePath(meta);
    }
    for (const tag of plan.tags) {
      updateTag(tag);
    }
  }
}
