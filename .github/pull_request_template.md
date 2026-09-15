## Summary

<!-- What changed and why? Keep this short and concrete. -->

## Related issue(s)

- Closes #

## Scope

<!-- Mark all that apply -->
- [ ] API (`apps/api`)
- [ ] Web (`apps/web`)
- [ ] Shared package (`packages/common`)
- [ ] Accessibility (`packages/accessibility`)
- [ ] Infrastructure / CI (`terraform`, `.github/workflows`)
- [ ] Documentation

## Behavioral impact

<!-- User-visible or API-visible changes -->
- [ ] No behavior change
- [ ] User-facing UI change
- [ ] API contract change
- [ ] Data model / migration change
- [ ] Auth / permission change

## Validation

<!-- Paste exact commands run and key result -->
```bash
yarn lint
yarn build
yarn test
```

### Targeted checks (if applicable)
```bash
yarn workspace @tbcm/api test -- <path-to-spec>
yarn workspace @tbcm/web test -- <path-to-test>
yarn workspace @tbcm/common test -- <path-to-spec>
```

## Screenshots / recordings (Web/UI)

<!-- Before/after for UI changes -->

## Deployment + rollback notes

<!-- For risky changes: rollout plan, feature flags, rollback path -->

## Checklist

- [ ] Followed repo conventions and module structure
- [ ] Updated shared types in `@tbcm/common` where needed
- [ ] Updated related docs (README/runbook/user manual/AI docs) if behavior changed
- [ ] No `console.log` or leftover debug code
- [ ] Added/updated tests for changed behavior
- [ ] No secrets or sensitive data in code, logs, or screenshots
