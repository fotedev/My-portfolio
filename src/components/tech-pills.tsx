/**
 * Tech-stack pills (DESIGN §7.4): mono font, Western digits, LTR even inside
 * AR pages — tech names are language-neutral tokens (bidi rule 8.4.3).
 */
export function TechPills({ items, label }: { items: string[]; label: string }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <ul className="flex flex-wrap gap-2" aria-label={label}>
      {items.map((tech) => (
        <li
          key={tech}
          dir="ltr"
          className="rounded-sm bg-accent-subtle px-2 py-0.5 font-mono text-xs text-accent"
        >
          {tech}
        </li>
      ))}
    </ul>
  );
}
