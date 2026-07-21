export const ONBOARDING_DISMISSED_KEY = "brainstats-onboarding-dismissed";
export const ONBOARDING_AI_TIPS_KEY = "brainstats-onboarding-ai-tips";
export const ONBOARDING_BUILDER_KEY = "brainstats-onboarding-builder";

export function isOnboardingDismissed() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "1";
}

export function dismissOnboarding() {
  window.localStorage.setItem(ONBOARDING_DISMISSED_KEY, "1");
}

export function isOnboardingStepDone(key: string) {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(key) === "1";
}

export function markOnboardingStepDone(key: string) {
  window.localStorage.setItem(key, "1");
}
