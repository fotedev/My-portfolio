import type { ReactNode } from "react";
import type { PillKind } from "@/lib/content/localize";

const pillClasses: Record<PillKind, string> = {
  success: "bg-success-bg text-success-text",
  neutral: "bg-neutral-subtle text-muted-foreground",
  warning: "bg-warning-bg text-warning-text",
};

/**
 * Status pill (DESIGN §10.5). Color never carries meaning alone — every pill
 * carries its text label ("Merged" / "Open PR" / "Acknowledged disclosure").
 */
export function StatusPill({ kind, children }: { kind: PillKind; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 type-pill ${pillClasses[kind]}`}
    >
      {children}
    </span>
  );
}
