export function getSafeRedirectPath(
  next: string | null | undefined,
  fallback = "/dashboard"
) {
  if (!next) {
    return fallback;
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }

  return next;
}

export const ANALYZE_DRAFT_KEY = "brainstats-analyze-draft";
export const ANALYZE_INPUT_MODE_KEY = "brainstats-analyze-input-mode";
