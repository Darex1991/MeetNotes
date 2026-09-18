# Repository Guidelines

MeetNotes: upload meeting recordings → background pipeline (Whisper transcription → diarization → Claude summary/action items/decisions) → notes in the dashboard. Built on the Selleo boilerplate; keep its conventions.

## Project Structure & Module Organization

- `apps/api`: NestJS backend. Feature folders hold module, service, controller (`api/`), TypeBox DTOs (`schemas/`) and tests (`__tests__/`).
  - `src/meetings`: `meetings.service.ts` (CRUD/upload), `meetings-processing.service.ts` (queue producer), `meetings-processing.consumer.ts` (BullMQ worker), `meetings-pipeline.service.ts` (the three stages), `meetings-export.ts` (Markdown).
  - `src/ai`: provider abstractions (`TranscriptionProvider`, `DiarizationProvider`, `SummaryProvider`) with adapters selected in `ai.module.ts` from `TRANSCRIPTION_ADAPTER` / `DIARIZATION_ADAPTER` / `SUMMARY_ADAPTER`. Always keep a no-credentials adapter (`mock`/`heuristic`) working — CI and e2e rely on them.
  - `src/ai/claude/claude.client.ts`: the only place that talks to the Anthropic SDK. Use structured outputs (`output_config.format: json_schema`) with a TypeBox schema and re-validate the result.
  - `src/file-storage`: S3 adapter; use `getFileStream` for worker downloads and `getSignedDownloadUrl` for browser playback.
  - Drizzle schema lives next to each feature (`*-schema.ts`) and is re-exported from `src/storage/schema/index.ts`; migrations in `src/storage/migrations`.
- `apps/web-app`: React Router 7 SPA. Domain code under `app/modules/dashboard/meetings` (`*.page.tsx`, `components/`, `meetings.utils.ts`); API hooks in `app/api/queries` and `app/api/mutations`; the Swagger client `app/api/generated-api.ts` is generated — never edit by hand, run `pnpm generate:client` after the API has started once.
- `apps/reverse-proxy`: Caddy config for `*.meetnotes.localhost`.
- `packages/`: shared eslint/tsconfig/email templates/shared utils.

## Build, Test, and Development Commands

- Install: `pnpm install` (Node 24+, pnpm 10). Infra: `docker compose up -d`, then `pnpm db:migrate`.
- Dev: `pnpm dev`; API only `pnpm --filter meeting-notes-api dev`; web only `pnpm --filter meeting-notes-web-app dev`.
- Migrations: `pnpm db:generate -- --name <name>` (drizzle-kit reads the schema, no DB needed) then `pnpm db:migrate`.
- Client: `pnpm generate:client`. Lint/format: `pnpm lint`, `pnpm format`. Typecheck: `pnpm typecheck:api`, `pnpm --filter meeting-notes-web-app typecheck`.

## Coding Style & Naming Conventions

- TypeScript, 2-space indent, Prettier + `@repo/eslint-config`. Nest classes PascalCase in kebab-case files; React components PascalCase; hooks `useX`.
- Controllers validate with `nestjs-typebox` `@Validate` and return `BaseResponse`. Map DB rows to DTOs explicitly (see `MeetingsService.toDetail`) so response validation never leaks columns.
- Queue jobs: one job per pipeline stage, `{ meetingId }` payload, `attempts: 3` with backoff; consumers must tolerate a deleted meeting.
- Frontend strings go through i18next (`app/locales/en.json` + `pl.json`); add both languages.
- Never commit `.env`; extend `.env.example` when adding config and validate it in `src/common/configuration/*.ts`.

## Testing Guidelines

- API unit: `pnpm test:api` (`*.spec.ts`, no infra). API e2e: `pnpm test:api:e2e` (`*.e2e-spec.ts`, needs Postgres + Redis, uses mock adapters via env in the script).
- Pure logic (adapters, export, alignment) gets a colocated spec; new endpoints get an e2e case using `createE2ETest` and `createQueueTestHarness`.
- Web: `pnpm test:web` (vitest + testing-library).

## Commit & Pull Request Guidelines

- Conventional commits (`feat: add pyannote adapter`), small and imperative. Note migrations / new env vars in the body.
- PRs describe the change, list commands run, attach UI/API screenshots when behaviour changes, and flag new env vars or migrations.
