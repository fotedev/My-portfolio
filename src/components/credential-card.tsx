import { ExternalArrow } from "@/components/ui/arrows";
import { btnPrimary, btnSecondary, externalLink } from "@/components/ui/cta";
import type { Credential } from "@/lib/content/queries";

export type CredentialCardLabels = {
  recipient: string;
  viewPdf: string;
  downloadPdf: string;
  pdfNote: string;
};

/**
 * Certificate artifact. Publication rules (CONTENT-EVIDENCE.md): program name
 * + recipient + issuer display line only; date/ID/verify-URL are TO VERIFY
 * and stay omitted. The PDF is linked, never embedded (prompt-4 §2).
 */
export function CredentialCard({ credential, labels }: { credential: Credential; labels: CredentialCardLabels }) {
  return (
    <article className="grid gap-6 rounded-xl border border-border-subtle bg-surface p-6 md:grid-cols-[1fr_auto] md:gap-10 md:p-8">
      <div>
        <h3 className="type-h3">
          <bdi>{credential.title}</bdi>
        </h3>
        <p className="mt-1.5 text-muted-foreground type-body-sm">{credential.issuerDisplay}</p>
        <p className="mt-4 max-w-2xl type-body-sm">{credential.summary}</p>
        <p className="mt-4 type-body-sm text-muted-foreground">
          {labels.recipient}: <bdi className="text-foreground">{credential.recipientName}</bdi>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 md:flex-col md:items-stretch">
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
        <a
          href={credential.proofUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${externalLink} justify-center`}
        >
          dub.ai/omp
          <ExternalArrow />
        </a>
      </div>
      <p className="type-body-sm text-muted-foreground md:col-start-1">{labels.pdfNote}</p>
    </article>
  );
}
