export const ONBOARDING_KEY = 'sah:onboarding-complete';
export const FIRST_INTENTION_EVENT = 'sah:first-intention-saved';
export type OnboardingProgress = { stage: 'writing' | 'complete'; entryId?: string };
export function eligibleForWelcome(createdAt: string, completed: boolean, hasActivity: boolean, now = Date.now()) {
  const age = now - new Date(createdAt).getTime();
  return !completed && !hasActivity && Number.isFinite(age) && age >= 0 && age < 86_400_000;
}
// Account-scoped progress protects shared devices; no journal text is stored here.
export function readOnboarding(storage: Pick<Storage, 'getItem'>, owner: string): OnboardingProgress | undefined {
  try {
    const raw = storage.getItem(ONBOARDING_KEY);
    if (raw === 'true') return { stage: 'complete' };
    const value = JSON.parse(raw || '{}')?.[owner];
    return value?.stage === 'complete' || value?.stage === 'writing' ? value : undefined;
  } catch { return undefined; }
}
export function writeOnboarding(storage: Pick<Storage, 'getItem' | 'setItem'>, owner: string, progress: OnboardingProgress) {
  let values: Record<string, OnboardingProgress> = {};
  try { const parsed = JSON.parse(storage.getItem(ONBOARDING_KEY) || '{}'); if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) values = parsed; } catch { /* recover preference */ }
  storage.setItem(ONBOARDING_KEY, JSON.stringify({ ...values, [owner]: progress }));
}
