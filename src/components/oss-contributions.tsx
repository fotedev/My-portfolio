import { StatusPill } from "@/components/status-pill";
import { externalLink } from "@/components/ui/cta";
import { statusPillKind } from "@/lib/content/localize";
import type { Contribution } from "@/lib/content/queries";

export type OssLabels = {
  statusOf: (status: string) => string;
  viewOnGithub: string;
  verifiedOn: (date: string) => string;
};

/**
 * One OSS/security record. Status pill semantics are locked (merged=success,
 * open=neutral, acknowledged=warning) and every entry shows its verification
 * date — the honesty record is the signature element of this site.
 */
export function OssContributionItem({
  contribution,
  labels,
}: {
  contribution: Contribution;
  labels: OssLabels;
}) {
  return (
    <li className="rounded-xl border border-border-subtle bg-surface p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <StatusPill kind={statusPillKind(contribution.status)}>
          {labels.statusOf(contribution.status)}
        </StatusPill>
        <span className="type-caption text-muted-foreground" dir="ltr">
          {contribution.repo}#{contribution.number}
        </span>
      </div>
      {/* Titles are verbatim English PR/issue titles in both locales — keep LTR. */}
      <h3 className="mt-2 type-body font-medium">
        <bdi dir="ltr">{contribution.title}</bdi>
      </h3>
      <p className="mt-2 text-muted-foreground type-body-sm">{contribution.summary}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="type-caption text-muted-foreground">{labels.verifiedOn(contribution.verificationDate)}</p>
        <a href={contribution.proofUrl} target="_blank" rel="noopener noreferrer" className={externalLink}>
          {labels.viewOnGithub}
          <span aria-hidden="true" className="text-xs">
            ↗
          </span>
        </a>
      </div>
    </li>
  );
}
