import { StatusPill } from "@/components/status-pill";
import { ExternalArrow } from "@/components/ui/arrows";
import { statusPillKind } from "@/lib/content/localize";
import type { Contribution } from "@/lib/content/queries";

export type OssLabels = {
  statusOf: (status: string) => string;
  verifiedOn: (date: string) => string;
};

/**
 * One OSS/security record, rendered as a ledger row (ADR-0009) rather than a
 * card: status pill + repo reference + verification date on the meta line,
 * the PR/issue title is the proof link. Status pill semantics are locked
 * (merged=success, open=neutral, acknowledged=warning) and every entry shows
 * its verification date — the honesty record is the signature element of
 * this site.
 */
export function OssContributionItem({
  contribution,
  labels,
}: {
  contribution: Contribution;
  labels: OssLabels;
}) {
  return (
    <li className="grid gap-2.5 border-b border-border-subtle py-7">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <StatusPill kind={statusPillKind(contribution.status)}>
          {labels.statusOf(contribution.status)}
        </StatusPill>
        <span className="type-mono-sm text-muted-foreground" dir="ltr">
          {contribution.repo}#{contribution.number}
        </span>
        <span className="ms-auto type-mono-sm text-muted-foreground tabular-nums">
          {labels.verifiedOn(contribution.verificationDate)}
        </span>
      </div>
      {/* Titles are verbatim English PR/issue titles in both locales — keep LTR. */}
      <h3 className="type-body font-medium">
        <a
          href={contribution.proofUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-start gap-1.5 transition-colors duration-150 hover:text-accent"
        >
          <bdi dir="ltr">{contribution.title}</bdi>
          <ExternalArrow className="mt-1 size-3.5 shrink-0" />
        </a>
      </h3>
      <p className="max-w-3xl text-muted-foreground type-body-sm">{contribution.summary}</p>
    </li>
  );
}
