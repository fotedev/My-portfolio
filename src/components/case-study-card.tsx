import { StatusPill } from "@/components/status-pill";
import { TechPills } from "@/components/tech-pills";
import { externalLink } from "@/components/ui/cta";
import type { ProjectCard } from "@/lib/content/queries";
import { Link } from "@/lib/i18n/navigation";

export type CaseStudyCardLabels = {
  caseStudy: string;
  liveDemo: string;
  sourceCode: string;
  privateRepo: string;
  stack: string;
};

function ForwardArrow() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 rtl:-scale-x-100"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ExternalArrow() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
    >
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}

/**
 * Interactive case-study card (DESIGN §10.3): hover = border + shadow color
 * only. The internal link (case-study page) is the primary action; external
 * proof links (live demo / source / private-repo pill) sit in the footer row —
 * multiple actions mean the card itself is not a single giant link.
 */
export function CaseStudyCard({ project, labels }: { project: ProjectCard; labels: CaseStudyCardLabels }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-border-subtle bg-surface p-6 transition-colors duration-150 hover:border-accent/45">
      <p className="type-caption text-muted-foreground">{labels.caseStudy}</p>
      <h3 className="mt-1 type-h3">
        <bdi>{project.title}</bdi>
      </h3>
      <p className="mt-2 text-muted-foreground type-body-sm">{project.summary}</p>
      <div className="mt-4">
        <TechPills items={project.techStack} label={labels.stack} />
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border-subtle pt-4 [&>*]:mt-4">
        <Link href={`/projects/${project.slug}`} className={`${externalLink} font-medium`}>
          {labels.caseStudy}
          <ForwardArrow />
        </Link>
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={externalLink}
          >
            {labels.liveDemo}
            <ExternalArrow />
          </a>
        )}
        {project.repoUrl ? (
          <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className={externalLink}>
            {labels.sourceCode}
            <ExternalArrow />
          </a>
        ) : (
          <StatusPill kind="neutral">{labels.privateRepo}</StatusPill>
        )}
      </div>
    </article>
  );
}
