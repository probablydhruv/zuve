# Usage Bar Updates

## Changes Made

### 1. Simplified Display
- **Before**: `"Plus - 2/5 (48h)"`
- **After**: `"Plus Tier"` with just the progress bar

The detailed usage information (like "2/5 (48h)") has been removed from the bar display for a cleaner look. The progress bar itself is sufficient to show usage at a glance.

### 2. Detailed Info in Tooltip
Users can hover over the tier name (with the info icon) to see detailed usage information:
- Single window tiers: Shows "X/Y images used (time window)"
- Multi-window tiers (Plus): Shows both constraints

### 3. Default Tier
All users now default to the **Free tier** by default:
- New users: Start with Free tier
- Existing users without tier: Automatically set to Free tier
- Reset usage: Preserves current tier (or defaults to Free)

## Visual Example

```
┌─────────────────────────────────────┐
│ Free Tier     ⓘ            Good    │
│ ████████████░░░░░░░░░░░░░░░░░       │
└─────────────────────────────────────┘
         ↑                        ↑
    Tier name                 Status
    (hover for details)
```

When hovering over "Free Tier ⓘ":
```
Tooltip: 3/5 images used (48h)
```

## Benefits

1. **Cleaner UI**: Less visual clutter in the sidebar
2. **Clear Tier Display**: Users always know which tier they're on
3. **Details on Demand**: Hover to see exact usage numbers
4. **Better Mobile Experience**: Simpler text fits better on small screens

## Default Tier Behavior

| Scenario | Result |
|----------|--------|
| New user | Free tier |
| Returning user (no saved tier) | Free tier |
| Returning user (with saved tier) | Saved tier preserved |
| After reset | Current tier preserved |
| After upgrade/downgrade | New tier applied |

All changes maintain backward compatibility with existing usage data!

