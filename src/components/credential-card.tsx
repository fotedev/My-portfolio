import { btnPrimary, btnSecondary, externalLink } from "@/components/ui/cta";
import type { Credential } from "@/lib/content/queries";

export type CredentialCardLabels = {
  eyebrow: string;
  recipient: string;
  viewPdf: string;
  downloadPdf: string;
  pdfNote: string;
};

/**
 * Certificate card. Publication rules (CONTENT-EVIDENCE.md): program name +
 * recipient + issuer logo credits only; date/ID/verify-URL are TO VERIFY and
 * stay omitted. The PDF is linked, never embedded (prompt-4 §2).
 */
export function CredentialCard({ credential, labels }: { credential: Credential; labels: CredentialCardLabels }) {
  return (
    <article className="rounded-xl border border-border-subtle bg-surface p-6">
      <p className="type-caption text-muted-foreground">{labels.eyebrow}</p>
      <h3 className="mt-1 type-h3">
        <bdi>{credential.title}</bdi>
      </h3>
      <p className="mt-1 text-muted-foreground type-body-sm">{credential.issuerDisplay}</p>
      <p className="mt-2 type-body-sm">{credential.summary}</p>
      <p className="mt-2 type-body-sm text-muted-foreground">
        {labels.recipient}: <bdi>{credential.recipientName}</bdi>
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {credential.pdfUrl && (
          <a href={credential.pdfUrl} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
            {labels.viewPdf}
          </a>
        )}
        {credential.pdfUrl && (
          <a href={`${credential.pdfUrl}?download=omp-certificate.pdf`} className={btnSecondary}>
            {labels.downloadPdf}
          </a>
        )}
        <a href={credential.proofUrl} target="_blank" rel="noopener noreferrer" className={externalLink}>
          dub.ai/omp
          <span aria-hidden="true" className="text-xs">
            ↗
          </span>
        </a>
      </div>
      <p className="mt-3 type-caption text-muted-foreground">{labels.pdfNote}</p>
    </article>
  );
}
