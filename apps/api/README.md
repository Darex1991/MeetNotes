# meeting-notes-api

NestJS API and BullMQ worker for MeetNotes. Handles auth (Better Auth), recording uploads to S3, the three-stage processing pipeline (transcription → diarization → AI summary) and the meetings REST API.

Key folders:

- `src/meetings` — upload/CRUD endpoints, queue producer and consumer, pipeline stages, Markdown export.
- `src/ai` — transcription, diarization and summary adapters (OpenAI Whisper, local whisper CLI, pyannote over HTTP, Claude, mock/heuristic fallbacks).
- `src/file-storage` — S3 adapter with streaming downloads and signed playback URLs.
- `src/storage/migrations` — Drizzle migrations.

Commands (run from the repo root unless noted):

```sh
pnpm --filter meeting-notes-api dev     # watch mode, http://localhost:3000 (override with PORT)
pnpm db:generate -- --name <name>       # new migration from the Drizzle schema
pnpm db:migrate
pnpm test:api                            # unit tests (no infra)
pnpm test:api:e2e                        # needs Postgres + Redis (docker compose up -d)
pnpm typecheck:api
```

Swagger UI is served at `/api`; the OpenAPI document is written to `src/swagger/api-schema.json` on every boot and feeds `pnpm generate:client`. Bull Board lives at `/queues`.

Configuration and architecture: see the root [README](../../README.md).
