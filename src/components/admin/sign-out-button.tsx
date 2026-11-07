"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { signOut } from "@/app/(admin)/admin/_actions/session";

/**
 * Client-side sign-out (prompt-6 §3 top bar). The server action revokes the
 * Supabase session and clears the sb-* cookies; the client then navigates to
 * the login screen and refreshes so server components re-read auth state.
 */
export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await signOut();
          router.replace("/admin/login");
          router.refresh();
        });
      }}
      className="min-h-9 rounded-md border border-border-subtle px-3 py-1.5 text-sm transition-colors hover:bg-background disabled:opacity-50"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
