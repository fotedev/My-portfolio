"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * EN/AR tab pair for editors (prompt-6 §3: one form, tabs EN/AR). AR is
 * disabled in en_only mode with an explicit hint. RTL direction is applied
 * to the AR panel so inputs render correctly while typing.
 */
export function LocaleTabs({ en, ar, arDisabled }: { en: ReactNode; ar: ReactNode; arDisabled?: boolean }) {
  const baseId = useId();
  const [tab, setTab] = useState<"en" | "ar">("en");

  const tabs = [
    { key: "en" as const, label: "English", panel: en },
    { key: "ar" as const, label: "العربية (Arabic)", panel: ar, disabled: arDisabled },
  ];

  return (
    <div>
      <div role="tablist" aria-label="Translation language" className="flex gap-1 border-b border-border-subtle">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            id={`${baseId}-tab-${item.key}`}
            aria-selected={tab === item.key}
            aria-controls={`${baseId}-panel-${item.key}`}
            disabled={item.disabled}
            onClick={() => {
              setTab(item.key);
            }}
            className={`min-h-11 rounded-t-md px-4 text-sm font-medium transition-colors disabled:opacity-40 ${
              tab === item.key
                ? "border-b-2 border-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tabs.map((item) => (
        <div
          key={item.key}
          role="tabpanel"
          id={`${baseId}-panel-${item.key}`}
          aria-labelledby={`${baseId}-tab-${item.key}`}
          hidden={tab !== item.key}
          dir={item.key === "ar" ? "rtl" : "ltr"}
          className="pt-4"
        >
          {item.disabled ? (
            <p className="rounded-lg bg-neutral-subtle p-4 text-sm text-muted-foreground">
              English-only mode is on — Arabic fields are hidden. Turn it off to add the Arabic
              translation (required before publishing).
            </p>
          ) : (
            item.panel
          )}
        </div>
      ))}
    </div>
  );
}
