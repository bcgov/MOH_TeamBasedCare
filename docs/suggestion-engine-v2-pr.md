# Suggestion Engine V2 - Technical Specification

## 1. Goal

**Purpose:** Help healthcare planners identify which roles/occupations to add to their care team to ensure all required care activities can be performed.

**User Question Being Answered:**
> "Given the activities I need performed and the roles I've already selected, which additional roles should I add to cover the gaps?"

---

## 2. Original Algorithm (V1)

```
1. Find "Non-Covered Activities"
   → Activities where NO selected role has Y or LC permission

2. For each candidate role NOT in the plan:
   → Calculate score based on non-covered activities only

3. Scoring:
   - Restricted Activity: Y = +4, LC = +3
   - Aspect of Practice:  Y = +3, LC = +2
   - Task:                Y = +2, LC = +1

4. Sort by score descending, return top suggestions
```

**Key Design Decision:** Only score against **non-covered** activities. Once an activity has any coverage, it doesn't contribute to scores.

---

## 3. The Problem

### Metric Mismatch

| Suggestion Engine | Coverage % Display |
|-------------------|-------------------|
| "Is each activity covered by ≥1 person?" | "What % of ALL cells in the matrix are Y?" |
| Stops when all activities have coverage | Can show 50% even when "done" |

**Example:**
```
10 activities, 2 occupations selected
Each activity has 1 Y from one occupation
→ Engine: "All covered, no suggestions"
→ UI: "50% within scope" (10 Y cells / 20 total cells)
```

User sees low % but no suggestions = confusion.

### Root Cause

The original algorithm optimizes for **feasibility** (can every task be done?).

The UI metrics show **matrix density** (how capable is the team overall?).

These are **different questions** but displayed as if they're the same thing.

---

## 4. V2 Changes

### 4.1 New Coverage Model

```typescript
interface CoverageSummary {
  gaps: Activity[];        // 0 capable staff → CRITICAL
  fragile: Activity[];     // 1 capable staff → AT RISK
  redundant: Activity[];   // 2+ capable staff → GOOD
  coveragePercent: number; // % of activities with ≥1 coverage
}
```

### 4.2 Tiered Suggestion Algorithm

```
TIER 1: GAP FILLING (Critical)
  → Activities with 0 coverage
  → Weight: 100 × criticality × permValue

TIER 2: REDUNDANCY (Important)
  → Activities with only 1 coverage (fragile)
  → Weight: 10 or 50 × criticality × fragilityBonus × permValue

TIER 3: FLEXIBILITY (Optional)
  → Increase overall matrix density
  → Weight: 1 or 5 × permValue
```

### 4.3 Criticality Multiplier

```typescript
const criticality = {
  'RESTRICTED_ACTIVITY': 3,  // High-risk activities
  'ASPECT_OF_PRACTICE': 2,   // Core clinical work
  'TASK': 1,                 // Support activities
};
```

### 4.4 Dynamic Weight Shifting

```typescript
const weights = gaps.length > 0
  ? { gap: 100, fragile: 10, density: 1 }   // Prioritize gap filling
  : { gap: 0, fragile: 50, density: 5 };    // Prioritize redundancy
```

### 4.5 LC Permission Value (0.6)

LC (Limits & Conditions) is weighted at 60% of full scope (Y) to reflect regulatory constraints.

```typescript
const permValue = perm === 'Y' ? 1.0 : 0.6;
```

### 4.6 LC-Only Fragility Bonus

```typescript
// Activity covered only by LC (no Y) is more fragile
const fragilityMultiplier = (yCount === 0 && lcCount === 1) ? 1.5 : 1.0;
```

### 4.7 Tier Assignment

A single occupation can contribute to multiple tiers for different activities:
- Fill gaps for Activity A (Tier 1 contribution)
- Add redundancy for Activity B (Tier 2 contribution)
- Add density for Activity C (Tier 3 contribution)

The occupation's final `tier` field reflects its **highest-value** contribution (1 > 2 > 3).

### 4.8 Coverage Tooltips on Overview Cards

Added info tooltips to the "Within scope" / "Limits" / "Outside scope" cards explaining:
- What the percentage means (matrix density)
- Activity coverage breakdown (gaps, at-risk, fully covered)
- Overall coverage percent

This addresses user confusion when the percentage seems low but no suggestions appear.

---

## 5. New Algorithm

```typescript
function getSuggestions(session, tempSelectedIds, page, pageSize) {
  // 1. Build coverage map
  const teamOccupationIds = new Set([...selectedOccupations, ...tempSelected]);
  const coverageMap = new Map<activityId, { yCount, lcCount }>();

  for (activity of selectedActivities) {
    let yCount = 0, lcCount = 0;
    for (occupation of teamOccupationIds) {
      const perm = getPermission(occupation, activity);
      if (perm === 'Y') yCount++;
      if (perm === 'LC') lcCount++;
    }
    coverageMap.set(activity.id, { yCount, lcCount });
  }

  // 2. Categorize activities
  const gaps = activities.filter(a => coverage === 0);
  const fragile = activities.filter(a => coverage === 1);
  const redundant = activities.filter(a => coverage >= 2);

  // 3. Determine weights based on current state
  const weights = gaps.length > 0
    ? { gap: 100, fragile: 10, density: 1 }
    : { gap: 0, fragile: 50, density: 5 };

  // 4. Score each candidate occupation
  for (candidate of allOccupationsNotOnTeam) {
    let score = 0;
    let gapsFilled = 0, redundancyGains = 0;

    for (activity of selectedActivities) {
      const perm = getPermission(candidate, activity);
      if (perm === 'RED') continue;

      const current = coverageMap.get(activity.id);
      const criticality = getCriticality(activity.type);
      const permValue = perm === 'Y' ? 1.0 : 0.6;

      if (current.yCount + current.lcCount === 0) {
        // Tier 1: Fills a gap
        gapsFilled++;
        score += weights.gap * criticality * permValue;
      } else if (current.yCount + current.lcCount === 1) {
        // Tier 2: Adds redundancy
        const fragilityBonus = (current.yCount === 0) ? 1.5 : 1.0;
        redundancyGains++;
        score += weights.fragile * criticality * fragilityBonus * permValue;
      }

      // Tier 3: Density contribution (always adds)
      score += weights.density * permValue;
    }

    candidate.score = Math.round(score);
    candidate.tier = gapsFilled > 0 ? 1 : redundancyGains > 0 ? 2 : 3;
  }

  // 5. Sort and paginate
  candidates.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  return {
    suggestions: paginate(candidates),
    summary: { gaps, fragile, redundant, coveragePercent },
    total, page, pageSize
  };
}
```

---

## 6. Summary of Changes

| Aspect | V1 | V2 |
|--------|----|----|
| **Coverage Definition** | Binary (any Y/LC = covered) | Depth-based (0, 1, 2+) |
| **Stops Suggesting When** | All activities have ≥1 coverage | Continues with Tier 2/3 |
| **Scoring Basis** | Uncovered activities only | Uncovered + fragile + density |
| **Weights** | Fixed (4/3/2 by type) | Dynamic by tier + criticality |
| **LC Handling** | Same as Y for coverage | Weighted at 60%, fragility bonus |
| **Scores** | Integer | Rounded integer |
| **Output** | Just suggestions | Suggestions + CoverageSummary |
| **UI** | No explanation | Tooltips explain metrics |

---

## 7. Backward Compatibility

The new algorithm prioritizes the same goals as V1:
- Tier 1 prioritizes gap filling (same concept as V1), but with a refined scoring formula that better differentiates Y vs LC permissions
- Tiers 2 and 3 are additive - they only activate when gaps are filled
- Response structure extends existing (adds `summary` field, doesn't remove anything)
- Frontend gracefully handles missing `summary` for legacy responses

**Note:** V2 scoring differs from V1. For example, V1 scored `RA+LC` equal to `AoP+Y` (both 3), while V2 scores `AoP+Y` (201) higher than `RA+LC` (181) because full scope (Y) is valued more than limited scope (LC).

---

## 8. Test Cases

### Tier 1: Gap Filling
- Activities with 0 coverage should trigger suggestions
- Higher-criticality gaps (RESTRICTED_ACTIVITY) should score higher
- Y permission should score higher than LC for same activity

### Tier 2: Redundancy
- Once all gaps filled, fragile activities (1 coverage) should trigger suggestions
- LC-only coverage should be flagged as more fragile (1.5x multiplier)
- RESTRICTED_ACTIVITY with single coverage should prioritize over TASK

### Tier 3: Flexibility
- When no gaps and no critical fragile activities, should still suggest for density
- Density-only suggestions should have lower scores than Tier 1/2

### Mixed Tier Contribution
- Occupation fills gaps for Activity A AND adds redundancy for Activity B
- Score should accumulate contributions from both tiers
- Final tier should be 1 (highest-value contribution)

### Edge Cases
- No activities selected → empty suggestions with message
- All activities fully covered (2+) → Tier 3 suggestions only
- No occupations can help → empty suggestions with message

### Coverage Stats (getPlanningActivityGap)
- Correctly calculates gaps/fragile/redundant counts
- Returns 100% coverage when all activities have at least one capable occupation
- Returns 0% coverage when no activities have capable occupations

---

## 9. What-If Simulation

Each suggestion now includes projected coverage metrics:

```typescript
simulatedCoverage: {
  gapsRemaining: number;      // Gaps remaining after adding this occupation
  fragileRemaining: number;   // Fragile activities remaining
  coveragePercent: number;    // New coverage % if added
  marginalBenefit: number;    // % improvement over current
}
```

**Use case**: User can see "If I add Nurse Practitioner, coverage goes from 60% → 85%" without trial-and-error.

---

## 10. Minimum Team Calculator

New endpoint: `POST /sessions/:sessionId/minimum-team`

Uses greedy set cover algorithm to find smallest team achieving maximum coverage:

```typescript
{
  occupationIds: string[];
  occupationNames: string[];
  achievedCoverage: number;
  uncoveredActivityIds: string[];
  uncoveredActivityNames: string[];
  totalActivities: number;
  isFullCoverage: boolean;
}
```

**Use case**: "What's the smallest team that can cover all my activities?"

---

## 11. Coverage Alerts

One alert per suggestion, prioritized by severity:

| Priority | Type | Trigger |
|----------|------|---------|
| 1 | `NO_GAP_COVERAGE` | Gaps exist but suggestion fills none |
| 2 | `REDUNDANT_ONLY` | Only adds redundancy to well-covered activities |
| 3 | `LOW_MARGINAL_BENEFIT` | Improves coverage by <5% |

---

## 12. Overview Percentage Fix

Changed from cell-based to activity-based calculation:

**Before (confusing)**:
```
% = Y cells / (occupations × activities)
→ 2 occupations covering all 10 activities = 50%
```

**After (intuitive)**:
```
inScope = activities with ≥1 Y permission
limits = activities with LC only
outOfScope = activities with no coverage
→ All 10 activities covered = 100%
```

---

## 13. Code Quality

- Extracted scoring weights to `SUGGESTION_SCORING` constants
- Refactored `getSuggestions` (344 lines → 7 focused helper methods)
- Added `docs/suggestion-engine-product-considerations.md` for PM/PO review

---

## 14. Test Coverage

**94 tests passing** including new tests for:
- Simulated coverage calculation
- Coverage alerts generation
- Minimum team algorithm
- Activity-based overview percentages
