# Copilot instructions for this repo

## AI workflow

- Start with `docs/ai/README.md` and `docs/tech-design-document.md`.
- Prefer the smallest change that keeps API, web, and shared types in sync.
- When user-facing behavior changes, update the matching hook/page/docs together.

## Commands

- Install dependencies with `yarn` at the repo root.
- Format: `yarn format:check`, `yarn format:write`, `yarn format:staged`
- Lint: `yarn lint` or package-specific:
  - `yarn workspace @tbcm/api lint`
  - `yarn workspace @tbcm/web lint`
  - `yarn workspace @tbcm/common lint`
- Build: `yarn build` or package-specific:
  - `yarn build-common`
  - `yarn workspace @tbcm/api build`
  - `yarn workspace @tbcm/web build`
  - `yarn workspace @tbcm/common build`
- Test: `yarn test` or `make test-jest`, or package-specific:
  - `make test-api`
  - `make test-web`
  - `yarn workspace @tbcm/common test`
- Single test runs:
  - API: `yarn workspace @tbcm/api test -- src/path/to/file.spec.ts`
  - Web: `yarn workspace @tbcm/web test -- src/path/to/file.test.tsx`
  - Common: `yarn workspace @tbcm/common test -- src/path/to/file.spec.ts`
- Browser (E2E) tests: `yarn workspace @tbcm/web e2e` (add `:headed` to watch it run).
  - Playwright drives the locally installed Google Chrome (`channel: 'chrome'`) because
    networks that intercept TLS cannot download Playwright's bundled Chromium.
  - Specs live in `apps/web/e2e`; they stub the API and seed auth into `localStorage`,
    so no running API or Keycloak login is needed.
  - Accessibility is checked with `@axe-core/playwright` (WCAG 2.1 A/AA) in
    `e2e/accessibility.spec.ts`, scoped to the feature under test because the app
    carries pre-existing violations elsewhere.
  - Use these for defects jsdom cannot reproduce, e.g. React 19 ignoring a library's
    `defaultProps`, or a button implicitly submitting a surrounding form.
- Local development:
  - `make run-local` starts the Dockerized stack
  - `yarn watch` runs API, web, and shared package watch modes
  - `yarn start:local` runs API + web locally

## Architecture

- Monorepo with Yarn workspaces: `apps/api`, `apps/web`, `packages/common`, and `packages/accessibility`.
- `apps/api` is a NestJS service backed by PostgreSQL via TypeORM. It is organized by domain module (`controller`/`service`/`module`/`entity`/`subscriber`/`dto`/`ro`) and bootstraps through `AppModule`.
- `apps/web` is a Next.js app with static export (`next.config.js` uses `output: 'export'`). Pages live in `src/pages`, shared UI lives in `src/components`, and API access is encapsulated in `src/services`.
- `packages/common` holds shared DTOs, response objects, constants, interfaces, helpers, and models used by both apps.
- `packages/accessibility` runs Pa11y checks and generates accessibility reporting.
- Terraform and GitHub Actions drive deployment and PR checks; the root `Makefile` wraps common Docker, build, migration, and AWS/Terraform workflows.
- `docs/ai/README.md` is the quick entry point for agents and maintainers.

## Conventions

- Prefer the existing domain folder structure in the API and keep related files together (`*.module.ts`, `*.controller.ts`, `*.service.ts`, entities, subscribers, DTOs, response objects).
- Shared exports use barrel files; import shared code from `@tbcm/common` rather than deep paths when possible.
- Web code uses path aliases from `apps/web/tsconfig.json`: `src/*`, `@components`, `@services`, and `@assets/*`.
- API code uses the `src/*` path alias from `apps/api/tsconfig.json`.
- Web hooks are named `use*` and exported from `src/services/index.ts`; UI components are exported from `src/components/index.tsx`.
- Read-only response types end in `.ro.ts`; DTOs end in `.dto.ts`.
- ESLint forbids `console.log` and unused variables, so keep code aligned with existing patterns instead of adding ad hoc logging.
- Local web/API integration depends on `NEXT_PUBLIC_API_URL` and the Docker service name `db` for PostgreSQL.
