// Usage tracking algorithm implementation
const WINDOW = 30 * 24 * 3600; // 30 days in seconds
const MAX_QUOTA = 400;
const OVERDRAFT = 3; // allow 2-3 extra images as UX buffer
const BASE_COOLDOWN_HOURS = 2; // minimum cooldown when overdraft exceeded

export interface UsageData {
  events: number[]; // timestamps
  cooldownUntil?: number; // timestamp
}

export interface UsageStatus {
  allowed: number;
  remainingQuota: number;
  dailyCap: number;
  color: 'green' | 'yellow' | 'red';
  cooldownUntil?: number;
  daysLeft: number;
  usedToday: number;
  allowedToday: number;
}

function pruneEvents(events: number[], now: number): number[] {
  const cutoff = now - WINDOW;
  return events.filter(t => t >= cutoff);
}

function countToday(events: number[], now: number): number {
  const last24h = now - 86400; // 24 hours ago
  return events.filter(t => t >= last24h).length;
}

function computeCaps(events: number[], now: number) {
  const prunedEvents = pruneEvents(events, now);
  const used = prunedEvents.length;
  const remainingQuota = MAX_QUOTA - used;
  
  let daysLeft: number;
  if (used === 0) {
    daysLeft = 30;
  } else {
    const oldest = Math.min(...prunedEvents);
    const windowEnd = oldest + WINDOW;
    daysLeft = Math.max(1, Math.ceil((windowEnd - now) / 86400));
  }
  
  const dailyCap = Math.floor(remainingQuota / daysLeft);
  return { events: prunedEvents, remainingQuota, daysLeft, dailyCap };
}

function indicatorColor(events: number[], now: number, dailyCap: number): 'green' | 'yellow' | 'red' {
  const last24h = countToday(events, now);
  if (last24h <= dailyCap) {
    return 'green';
  } else if (last24h <= dailyCap + OVERDRAFT) {
    return 'yellow';
  } else {
    return 'red';
  }
}

export function handleRequest(user: UsageData, now: number, requestedN: number = 1): UsageStatus {
  console.log('handleRequest - cooldownUntil:', user.cooldownUntil, 'now:', now, 'inCooldown:', user.cooldownUntil && now < user.cooldownUntil);
  
  // Check if user is in cooldown
  if (user.cooldownUntil && now < user.cooldownUntil) {
    const { events, remainingQuota, daysLeft, dailyCap } = computeCaps(user.events, now);
    const usedToday = countToday(events, now);
    console.log('In cooldown - returning red status');
    return {
      allowed: 0,
      remainingQuota,
      dailyCap,
      color: 'red',
      cooldownUntil: user.cooldownUntil,
      daysLeft,
      usedToday,
      allowedToday: 0
    };
  }

  const { events, remainingQuota, daysLeft, dailyCap } = computeCaps(user.events, now);
  const usedToday = countToday(events, now);
  let allowedToday = dailyCap - usedToday;
  if (allowedToday < 0) allowedToday = 0;

  const allowedWithOverdraft = allowedToday + OVERDRAFT;
  let allowed = Math.min(requestedN, remainingQuota, allowedWithOverdraft);

  // If user asked for more than allowed_with_overdraft OR if they've exceeded daily limit -> compute cooldown
  if (requestedN > allowedWithOverdraft || (usedToday >= dailyCap + OVERDRAFT)) {
    const excess = Math.max(requestedN - allowedWithOverdraft, 1); // At least 1 for exceeding daily limit
    const extraHours = Math.ceil(excess / 20.0); // 1 extra hour per ~20 extra images
    const cooldownHours = BASE_COOLDOWN_HOURS + extraHours;
    user.cooldownUntil = now + cooldownHours * 3600;
    // Allow the allowed_with_overdraft amount now (partial fulfill)
    allowed = Math.min(allowedWithOverdraft, remainingQuota);
  }

  // Record allowed images as events
  const newEvents = [...events];
  for (let i = 0; i < allowed; i++) {
    newEvents.push(now + i * 0.001); // Add tiny offset to avoid duplicate timestamps
  }
  
  // Update user events
  user.events = pruneEvents(newEvents, now);

  const color = user.cooldownUntil && now < user.cooldownUntil ? 'red' : indicatorColor(user.events, now, dailyCap);
  
  console.log('UsageTracker - usedToday:', usedToday, 'dailyCap:', dailyCap, 'OVERDRAFT:', OVERDRAFT, 'cooldownUntil:', user.cooldownUntil, 'color:', color, 'inCooldown:', user.cooldownUntil && now < user.cooldownUntil);
  
  return {
    allowed,
    remainingQuota: MAX_QUOTA - user.events.length,
    dailyCap,
    color,
    cooldownUntil: user.cooldownUntil,
    daysLeft,
    usedToday: countToday(user.events, now),
    allowedToday: Math.max(0, dailyCap - countToday(user.events, now))
  };
}

export function getCurrentUsageStatus(user: UsageData): UsageStatus {
  const now = Math.floor(Date.now() / 1000);
  return handleRequest(user, now, 0); // Request 0 to just get status
}
