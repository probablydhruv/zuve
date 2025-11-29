// Tier-based usage tracking system

export type TierType = 'free' | 'plus' | 'pro' | 'max'

export interface UsageData {
  events: number[] // timestamps
  cooldownUntil?: number // timestamp
  tier?: TierType // user's current tier
}

interface WindowConstraint {
  duration: number // in seconds
  quota: number
  label: string // for display (e.g., "48h", "30d")
}

interface TierConfig {
  name: string
  windows: WindowConstraint[]
  overdraft: number
  cooldownHours: number
}

const TIERS: Record<TierType, TierConfig> = {
  free: {
    name: 'Free',
    windows: [
      { duration: 48 * 3600, quota: 5, label: '48h' }
    ],
    overdraft: 1,
    cooldownHours: 1
  },
  plus: {
    name: 'Plus',
    windows: [
      { duration: 48 * 3600, quota: 10, label: '48h' },        // Short-term burst protection
      { duration: 30 * 24 * 3600, quota: 60, label: '30d' }    // Long-term monthly cap
    ],
    overdraft: 2,
    cooldownHours: 2
  },
  pro: {
    name: 'Pro',
    windows: [
      { duration: 30 * 24 * 3600, quota: 1000, label: '30d' }
    ],
    overdraft: 5,
    cooldownHours: 0.5
  },
  max: {
    name: 'Max',
    windows: [
      { duration: 30 * 24 * 3600, quota: 2000, label: '30d' }
    ],
    overdraft: 10,
    cooldownHours: 0
  }
}

interface WindowUsage {
  window: WindowConstraint
  used: number
  remaining: number
  percentage: number
}

export interface UsageStatus {
  allowed: number
  color: 'green' | 'yellow' | 'red'
  cooldownUntil?: number
  tier: TierType
  tierName: string
  windowUsages: WindowUsage[] // Info about each window constraint
  bottleneckWindow?: WindowConstraint // Which window is most restrictive
  remainingInBottleneck: number
  overdraft: number
}

/**
 * Count events within a specific time window
 */
function countInWindow(events: number[], now: number, windowDuration: number): number {
  const cutoff = now - windowDuration
  return events.filter(t => t >= cutoff).length
}

/**
 * Prune events older than the longest window in the tier
 */
function pruneEvents(events: number[], now: number, tier: TierConfig): number[] {
  const longestWindow = Math.max(...tier.windows.map(w => w.duration))
  const cutoff = now - longestWindow
  return events.filter(t => t >= cutoff)
}

/**
 * Determine the color based on usage across all windows
 */
function determineColor(
  windowUsages: WindowUsage[],
  overdraft: number,
  inCooldown: boolean
): 'green' | 'yellow' | 'red' {
  if (inCooldown) return 'red'
  
  // Find the most constrained window (highest percentage)
  const maxPercentage = Math.max(...windowUsages.map(w => w.percentage))
  
  // Green: comfortable margin (< 80% of quota)
  if (maxPercentage < 80) return 'green'
  
  // Yellow: approaching limit or in overdraft zone
  // Check if any window has reached quota but still has overdraft room
  const anyInOverdraft = windowUsages.some(w => w.remaining < overdraft && w.remaining >= 0)
  if (anyInOverdraft || maxPercentage < 100) return 'yellow'
  
  // Red: exceeded quota
  return 'red'
}

/**
 * Main request handler - checks usage against tier limits and records events
 */
export function handleRequest(
  user: UsageData, 
  now: number, 
  requestedN: number = 1
): UsageStatus {
  // Default to free tier if not specified
  const tierKey = user.tier || 'free'
  const tier = TIERS[tierKey]
  
  console.log(`handleRequest - tier: ${tierKey}, requested: ${requestedN}, cooldownUntil:`, user.cooldownUntil)
  
  // Check cooldown first
  const inCooldown = !!(user.cooldownUntil && now < user.cooldownUntil)
  
  if (inCooldown) {
    console.log('In cooldown - blocking request')
    
    // Still calculate usage info for display
    const prunedEvents = pruneEvents(user.events, now, tier)
    const windowUsages: WindowUsage[] = tier.windows.map(window => {
      const used = countInWindow(prunedEvents, now, window.duration)
      const remaining = window.quota - used
      return {
        window,
        used,
        remaining,
        percentage: (used / window.quota) * 100
      }
    })
    
    const bottleneckWindow = windowUsages.reduce((most, current) => 
      current.percentage > most.percentage ? current : most
    ).window
    
    return {
      allowed: 0,
      color: 'red',
      cooldownUntil: user.cooldownUntil,
      tier: tierKey,
      tierName: tier.name,
      windowUsages,
      bottleneckWindow,
      remainingInBottleneck: Math.min(...windowUsages.map(w => w.remaining)),
      overdraft: tier.overdraft
    }
  }
  
  // Prune old events
  const prunedEvents = pruneEvents(user.events, now, tier)
  
  // Check all window constraints
  const windowUsages: WindowUsage[] = tier.windows.map(window => {
    const used = countInWindow(prunedEvents, now, window.duration)
    const remaining = window.quota - used
    return {
      window,
      used,
      remaining,
      percentage: (used / window.quota) * 100
    }
  })
  
  // Find the most restrictive window (least remaining capacity)
  let mostRestrictiveRemaining = Infinity
  let bottleneckWindow = tier.windows[0]
  
  for (const usage of windowUsages) {
    if (usage.remaining < mostRestrictiveRemaining) {
      mostRestrictiveRemaining = usage.remaining
      bottleneckWindow = usage.window
    }
  }
  
  console.log('Window constraints:', windowUsages.map(w => 
    `${w.window.label}: ${w.used}/${w.window.quota}`
  ))
  console.log('Most restrictive remaining:', mostRestrictiveRemaining)
  
  // Calculate allowed with overdraft
  // mostRestrictiveRemaining = quota - used
  // If positive: within quota, can use remaining + overdraft
  // If negative but >= -overdraft: in overdraft zone, can use remaining overdraft
  // If negative and < -overdraft: exceeded quota + overdraft, block completely
  let allowed: number
  
  if (mostRestrictiveRemaining < -tier.overdraft) {
    // Exceeded quota + overdraft - block completely
    allowed = 0
    console.log('Exceeded quota + overdraft - blocking generation')
  } else if (mostRestrictiveRemaining < 0) {
    // In overdraft zone (used quota but not all overdraft yet)
    // Allow only what's left in the overdraft buffer
    const remainingOverdraft = mostRestrictiveRemaining + tier.overdraft
    allowed = Math.max(0, Math.min(requestedN, remainingOverdraft))
    console.log(`In overdraft zone - remaining overdraft: ${remainingOverdraft}, allowed: ${allowed}`)
  } else {
    // Within quota - can use remaining quota + full overdraft
    const allowedWithOverdraft = mostRestrictiveRemaining + tier.overdraft
    allowed = Math.min(requestedN, allowedWithOverdraft)
    console.log(`Within quota - allowed with overdraft: ${allowedWithOverdraft}, allowed: ${allowed}`)
  }
  
  // Trigger cooldown if request exceeds what's available with overdraft
  // Only trigger if we're not already blocking (allowed > 0)
  if (allowed > 0 && requestedN > allowed && tier.cooldownHours > 0) {
    console.log(`Triggering cooldown: requested ${requestedN} > allowed ${allowed}`)
    user.cooldownUntil = now + tier.cooldownHours * 3600
    // Still allow what we calculated, but set cooldown
  } else if (allowed === 0 && mostRestrictiveRemaining < 0) {
    // If we're blocking because they've exceeded limits, trigger cooldown
    if (tier.cooldownHours > 0) {
      console.log('Blocking due to exceeded limits - triggering cooldown')
      user.cooldownUntil = now + tier.cooldownHours * 3600
    }
  }
  
  // Record allowed images as events
  const newEvents = [...prunedEvents]
  for (let i = 0; i < allowed; i++) {
    newEvents.push(now + i * 0.001) // Add tiny offset to avoid duplicate timestamps
  }
  
  // Update user events
  user.events = newEvents
  
  // Recalculate window usages with new events
  const updatedWindowUsages: WindowUsage[] = tier.windows.map(window => {
    const used = countInWindow(newEvents, now, window.duration)
    const remaining = window.quota - used
    return {
      window,
      used,
      remaining,
      percentage: (used / window.quota) * 100
    }
  })
  
  // Update most restrictive
  mostRestrictiveRemaining = Math.min(...updatedWindowUsages.map(w => w.remaining))
  
  const color = determineColor(
    updatedWindowUsages, 
    tier.overdraft,
    !!(user.cooldownUntil && now < user.cooldownUntil)
  )
  
  console.log(`Result - allowed: ${allowed}, color: ${color}, remaining: ${mostRestrictiveRemaining}`)
  
  return {
    allowed,
    color,
    cooldownUntil: user.cooldownUntil,
    tier: tierKey,
    tierName: tier.name,
    windowUsages: updatedWindowUsages,
    bottleneckWindow,
    remainingInBottleneck: mostRestrictiveRemaining,
    overdraft: tier.overdraft
  }
}

/**
 * Get current usage status without making a request
 */
export function getCurrentUsageStatus(user: UsageData, tier?: TierType): UsageStatus {
  const now = Math.floor(Date.now() / 1000)
  if (tier && tier !== user.tier) {
    user.tier = tier
  }
  return handleRequest(user, now, 0) // Request 0 to just get status
}

/**
 * Helper to get tier configuration
 */
export function getTierConfig(tier: TierType): TierConfig {
  return TIERS[tier]
}
