# Suggestion Engine: Product Enhancement Opportunities

**Document Purpose**: This document outlines potential product enhancements to the Team-Based Care suggestion engine that require product owner decisions. These features could significantly improve the tool's value for healthcare workforce planning but require business/regulatory input before implementation.

**Prepared by**: Development Team
**Date**: February 2026
**Status**: For Discussion

---

## Executive Summary

### What the Suggestion Engine Does Today

The suggestion engine helps healthcare planners build optimal teams by:

1. **Analyzing coverage gaps** - Identifies activities that no team member can perform
2. **Scoring occupations** - Ranks potential hires by their ability to fill gaps
3. **Prioritizing by criticality** - Weights Restricted Activities > Aspects of Practice > Tasks
4. **Distinguishing Y vs LC** - Full scope (Y) weighted higher than Limited/Conditional (LC)

### Current Limitations

The algorithm treats all occupations as equally available and equally costly. In the real world of healthcare staffing shortages, this isn't true. A recommendation to "add a Nurse Practitioner" may not be actionable if there are no NPs available to hire.

---

## Feature Opportunities

### 1. Staff Availability/Scarcity Weighting

**Problem Statement**
The suggestion engine may recommend scarce occupations when more available alternatives exist. For example, recommending Registered Nurses when the region has 1,000+ RN vacancies, while Licensed Practical Nurses (who can perform many of the same activities) are more available.

**Proposed Solution**
Add an "availability score" to each occupation that influences ranking:

| Availability Level | Multiplier | Example |
|-------------------|------------|---------|
| Critically Scarce | 0.3x | Rural physicians |
| Scarce | 0.5x | Nurse Practitioners |
| Moderate | 0.8x | Registered Nurses |
| Available | 1.0x | Healthcare Aides |
| Surplus | 1.2x | Recent graduate pools |

**Data Requirements**
- Regional vacancy data by occupation (could integrate with Health Match BC or similar)
- Optional: Organization-specific availability overrides
- Update frequency: Quarterly recommended

**Product Decisions Needed**
- [ ] Should availability data be province-wide or regional?
- [ ] Who maintains the availability scores?
- [ ] Should users be able to override/customize for their organization?

---

### 2. Cost/Budget Optimization Mode

**Problem Statement**
A Physician and a Healthcare Aide might both fill a care gap, but at vastly different salary costs. Budget-constrained managers need to understand cost implications.

**Proposed Solution**
Optional "cost-aware" mode that factors in relative compensation:

```
Adjusted Score = Base Score × (1 / Relative Cost Factor)
```

| Occupation | Relative Cost Factor | Effect |
|------------|---------------------|--------|
| Physician | 4.0x | Scores reduced to 25% |
| Nurse Practitioner | 2.5x | Scores reduced to 40% |
| Registered Nurse | 1.5x | Scores reduced to 67% |
| Licensed Practical Nurse | 1.0x | Baseline |
| Healthcare Aide | 0.7x | Scores increased to 143% |

**Data Requirements**
- Relative salary bands by occupation (not actual salaries)
- Could use public sector pay scales as reference

**Product Decisions Needed**
- [ ] Should cost optimization be default or opt-in?
- [ ] Should we show actual salary ranges or just relative comparisons?
- [ ] Privacy/sensitivity concerns with displaying compensation data?

---

### 3. Team Composition Constraints

**Problem Statement**
Healthcare teams have regulatory requirements that the current algorithm doesn't enforce:

- "Every shift must have at least 1 RN"
- "Maximum 3 unregulated workers per regulated professional"
- "Medication administration requires prescribing authority on-call"

**Proposed Solution**
Allow administrators to define team composition rules:

```yaml
constraints:
  - type: minimum_count
    occupation_category: "Regulated Nurse"
    count: 1

  - type: ratio
    numerator: "Unregulated Care Provider"
    denominator: "Regulated Professional"
    max_ratio: 3:1

  - type: capability_required
    capability: "prescribing_authority"
    availability: "on_shift_or_on_call"
```

The suggestion engine would then:
1. Warn if current team violates constraints
2. Prioritize suggestions that help meet unmet constraints
3. Show compliance status in the dashboard

**Data Requirements**
- Capability/credential mapping per occupation
- Constraint definitions (could start with BC Health Authority standards)
- Constraint violation severity levels

**Product Decisions Needed**
- [ ] Should constraints be enforced (block saving) or advisory (warnings)?
- [ ] Who can create/modify constraints? (Admin only vs. regional managers)
- [ ] Should we ship with default BC Health Authority constraints?

---

### 4. LC (Limits/Conditions) Permission Granularity

**Problem Statement**
Currently, all "LC" (Limits and Conditions) permissions are treated equally at 60% weight. In reality, some LCs are minor (documentation only) while others are major (requires physician co-signature).

**Examples of LC Variation**:

| LC Type | Restriction | Practical Impact |
|---------|------------|------------------|
| Documentation | Must document rationale | Minimal - standard practice |
| Supervision | Must have RN available | Moderate - scheduling consideration |
| Direct Supervision | RN must be present | Significant - limits flexibility |
| Co-signature | Physician must countersign | Major - workflow bottleneck |

**Proposed Solution**
Add LC severity levels with differentiated weights:

| LC Severity | Weight | Description |
|-------------|--------|-------------|
| Minor | 0.9x | Documentation requirements only |
| Moderate | 0.7x | Indirect supervision required |
| Significant | 0.5x | Direct supervision required |
| Major | 0.3x | Requires co-signature or delegation |

**Data Requirements**
- LC severity classification for each occupation-activity combination
- This is a significant data enhancement to the existing permissions matrix
- Estimated effort: Would require SME review of ~15,000 permission records

**Product Decisions Needed**
- [ ] Is this level of granularity valuable enough to justify data collection effort?
- [ ] Who classifies LC severity? (Provincial body vs. individual organizations)
- [ ] Should severity be visible to end users or only affect scoring?

---

## Implementation Priority Recommendation

Based on value vs. effort analysis:

| Priority | Feature | Value | Effort | Recommendation |
|----------|---------|-------|--------|----------------|
| 1 | Team Composition Constraints | High | Medium | Start with simple rules, expand |
| 2 | Staff Availability Weighting | High | Low | If data source available |
| 3 | Cost Optimization Mode | Medium | Low | Quick win, low risk |
| 4 | LC Granularity | Medium | High | Defer unless SME resources available |

---

## Next Steps

1. **Product Owner Review**: Discuss features and prioritization
2. **Data Assessment**: Determine availability of required data sources
3. **Stakeholder Input**: Validate assumptions with healthcare managers
4. **Pilot Scope**: Select 1-2 features for initial pilot

---

## Appendix: Technical Readiness

The suggestion engine architecture supports these enhancements:

- **Scoring system is configurable** - Weights can be adjusted without algorithm changes
- **Modular design** - New scoring factors can be added as multipliers
- **Database schema** - Can accommodate new occupation attributes

No major architectural changes required. Estimated development effort:

| Feature | Backend | Frontend | Testing | Total |
|---------|---------|----------|---------|-------|
| Availability Weighting | 2 days | 1 day | 1 day | 4 days |
| Cost Optimization | 2 days | 2 days | 1 day | 5 days |
| Team Constraints | 5 days | 3 days | 2 days | 10 days |
| LC Granularity | 3 days | 1 day | 2 days | 6 days + data work |

---

*This document is intended to facilitate product discussions. Technical implementation details are available upon request.*
