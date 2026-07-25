import { track } from "@vercel/analytics";

type EventProps = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(name: string, properties?: EventProps) {
  if (typeof window === "undefined") {
    return;
  }

  const cleaned = properties
    ? Object.fromEntries(
        Object.entries(properties).filter(([, value]) => value !== undefined)
      )
    : undefined;

  try {
    track(name, cleaned as Record<string, string | number | boolean>);
  } catch {
    // Analytics should never block checkout or navigation.
  }
}
