import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { TechPills } from "@/components/tech-pills";
import { ExternalArrow, ForwardArrow } from "@/components/ui/arrows";
import { externalLink } from "@/components/ui/cta";
import type { CaseStudy } from "@/lib/content/queries";


export type CaseStudyLabels = {
  backToProjects: string;
  caseStudy: string;
  liveDemo: string;
  sourceCode: string;
  privateRepo: string;
  stack: string;
  problem: string;
  solution: string;
  results: string;
  lastUpdated: string;
};

/**
 * Case-study body shared by the public page and the auth-gated draft preview
 * (prompt-6 §5): one rendering path, so preview shows exactly what visitors
 * will see. Labels are passed in — the public page maps next-intl messages,
 * the admin preview supplies its own English backoffice strings.
 */
export function CaseStudyView({
  study,
  labels,
}: {
  study: CaseStudy;
  labels: CaseStudyLabels;
}) {
  return (
    <div className="container-reading">
      <Link
        href="/projects"
        className={`inline-flex min-h-11 items-center gap-1 text-muted-foreground transition-colors duration-150 hover:text-foreground ${externalLink}`}
      >
        <ForwardArrow className="size-4 rotate-180" />
        {labels.backToProjects}
      </Link>

      <h1 className="mt-10 type-h1">
        <bdi>{study.title}</bdi>
      </h1>
      <p className="mt-4 text-muted-foreground type-body-lg">{study.summary}</p>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        {study.liveUrl && (
          <a href={study.liveUrl} target="_blank" rel="noopener noreferrer" className={externalLink}>
            {labels.liveDemo}
            <ExternalArrow />
          </a>
        )}
        {study.repoUrl ? (
          <a href={study.repoUrl} target="_blank" rel="noopener noreferrer" className={externalLink}>
            {labels.sourceCode}
            <ExternalArrow />
          </a>
        ) : (
          <StatusPill kind="neutral">{labels.privateRepo}</StatusPill>
        )}
      </div>

      <div className="mt-6">
        <TechPills items={study.techStack} label={labels.stack} />
      </div>

      <section className="mt-14" aria-labelledby="study-problem">
        <h2 id="study-problem" className="type-h2">
          {labels.problem}
        </h2>
        <p className="mt-4 type-body">{study.problem}</p>
      </section>

      <section className="mt-12" aria-labelledby="study-solution">
        <h2 id="study-solution" className="type-h2">
          {labels.solution}
        </h2>
        <p className="mt-4 type-body">{study.solution}</p>
      </section>

      {study.results && (
        <section className="mt-12" aria-labelledby="study-results">
          <h2 id="study-results" className="type-h2">
            {labels.results}
          </h2>
          <p className="mt-4 type-body">{study.results}</p>
        </section>
      )}

      <p className="mt-14 border-t border-border-subtle pt-6 type-mono-sm text-muted-foreground tabular-nums">
        {labels.lastUpdated}
      </p>
    </div>
  );
}
