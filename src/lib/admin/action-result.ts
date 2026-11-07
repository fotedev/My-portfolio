/** Typed action result contract (prompt-6 §4: every action returns {ok, error?}; never fakes success). */
export type ActionErrorCode = "unauthorized" | "validation" | "conflict" | "storage" | "server";

export type ActionResult =
  | { ok: true; message?: string; id?: string }
  | { ok: false; error: string; code: ActionErrorCode };

export const UNAUTHORIZED: ActionResult = {
  ok: false,
  error: "Your session expired — reload the page and sign in again.",
  code: "unauthorized",
};

export function validationError(message: string): ActionResult {
  return { ok: false, error: message, code: "validation" };
}

export function serverError(operation: string, requestId: string): ActionResult {
  return {
    ok: false,
    error: `Something went wrong while saving (${operation}). The failure was logged — retry; if it persists, check the server logs with id ${requestId}.`,
    code: "server",
  };
}

/** First human-readable message from a ZodError, prefixed by the failing field. */
export function firstIssue(error: { issues: Array<{ path: Array<string | number | symbol>; message: string }> }): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid input.";
  const path = issue.path.filter((segment) => typeof segment === "string").join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}
