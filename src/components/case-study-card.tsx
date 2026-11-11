import { StatusPill } from "@/components/status-pill";
import { TechPills } from "@/components/tech-pills";
import { ExternalArrow, ForwardArrow } from "@/components/ui/arrows";
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

/**
 * Case-study card (DESIGN §10.3): hover = border color only, no scale/translate.
 * `featured` marks the anchor case study — same anatomy, larger type, and it
 * spans the full grid row on lg. The internal link (case-study page) is the
 * primary action; external proof links (live demo / source / private-repo
 * pill) sit in the footer row — multiple actions mean the card itself is not
 * a single giant link.
 */
export function CaseStudyCard({
  project,
  labels,
  featured = false,
}: {
  project: ProjectCard;
  labels: CaseStudyCardLabels;
  featured?: boolean;
}) {
  return (
    <article
      className={`flex h-full flex-col rounded-xl border border-border-subtle bg-surface transition-colors duration-150 hover:border-accent/45 ${
        featured ? "p-6 md:p-8" : "p-6"
      }`}
    >
      <h3 className={featured ? "text-xl font-semibold md:text-2xl" : "type-h3"}>
        <bdi>{project.title}</bdi>
      </h3>
      <p className={`mt-2 max-w-2xl text-muted-foreground ${featured ? "type-body" : "type-body-sm"}`}>
        {project.summary}
      </p>
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
