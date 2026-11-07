"use client";

import { useEffect } from "react";

/**
 * Unsaved-changes guard (prompt-6 §3): warns before closing/reloading a dirty
 * editor. Navigation between admin routes is handled by the editor's own
 * cancel flow; this covers tab close/refresh.
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    function beforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      // Chrome requires returnValue to be set; message is browser-controlled.
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [dirty]);
}
