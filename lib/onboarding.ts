export const ONBOARDING_DISMISSED_KEY = "brainstats-onboarding-dismissed";

export function isOnboardingDismissed() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "1";
}

export function dismissOnboarding() {
  window.localStorage.setItem(ONBOARDING_DISMISSED_KEY, "1");
}
