# MeetNotes — AI notes from meeting recordings

Upload an audio or video recording of a meeting and get, a few minutes later:

- a **transcript** with timestamps (Whisper),
- a **speaker breakdown** (diarization),
- an **AI summary**, **action items** (owner, due date, priority) and **decisions** (Claude),
- a **Markdown export** of the whole thing.

Processing is slow by nature, so everything after the upload runs as **background jobs** (BullMQ on Redis) split into three stages — `TRANSCRIBE → DIARIZE → SUMMARIZE` — each with its own retries. The dashboard polls for progress, so you can close the tab and come back.

Built on the [Selleo boilerplate](https://github.com/Selleo/boilerplate) (NestJS + Drizzle + Better Auth API, React Router 7 + shadcn/ui web app, pnpm/turbo monorepo).

---

## Table of contents

1. [How it works](#how-it-works)
2. [Quickstart](#quickstart)
3. [Configuration](#configuration)
4. [AI adapters](#ai-adapters)
5. [Monorepo layout](#monorepo-layout)
6. [API](#api)
7. [Tooling commands](#tooling-commands)
8. [Testing](#testing)
9. [Production notes](#production-notes)
10. [Troubleshooting](#troubleshooting)
11. [License & credits](#license--credits)

---

## How it works

```
 browser ──POST /meetings (multipart)──▶ API ──▶ S3 bucket (recording)
                                         │
                                         └──▶ Postgres: meeting{status: uploaded}
                                         └──▶ Redis queue: TRANSCRIBE {meetingId}

 worker (same Nest process, BullMQ consumer, concurrency 2)
   TRANSCRIBE  status=transcribing  download → TranscriptionProvider → transcript[]   → enqueue DIARIZE
   DIARIZE     status=diarizing     download → DiarizationProvider   → speakers       → enqueue SUMMARIZE
   SUMMARIZE   status=summarizing   SummaryProvider (Claude, structured JSON)         → status=completed

 browser polls GET /meetings/:id every 3 s while status ∈ {uploaded, transcribing, diarizing, summarizing}
```

Meeting statuses: `uploaded → transcribing → diarizing → summarizing → completed`, or `failed` (with `failedStage` and `errorMessage`). `progress` is 0–100 and is updated inside each stage.

- Each stage is a separate job (`attempts: 3`, exponential backoff). If the summary fails, the 40-minute transcription is not redone.
- After the last attempt the meeting is marked `failed` with `failedStage` + `errorMessage`; the UI offers **Retry from this step**.
- Bull Board is mounted at `/queues` (basic auth `admin` / `BULLBOARD_PASSWORD`) to watch jobs.
- Every AI step is an **adapter** chosen by env var, and each has a no-credentials fallback, so the full pipeline runs locally and in CI with `mock` / `heuristic` adapters.

## Quickstart

Prerequisites: Node ≥ 24.8 (`.nvmrc`), pnpm 10, Docker + Compose, [Caddy](https://caddyserver.com/docs/install) for local HTTPS.

```sh
pnpm install

cp apps/api/.env.example apps/api/.env
cp apps/web-app/.env.example apps/web-app/.env

docker compose up -d            # Postgres, Redis, Mailpit, RustFS (S3) + bucket init
pnpm db:migrate                 # creates auth, file and meeting tables

cd apps/reverse-proxy && caddy run   # first run only: trust the local certs, then Ctrl+C
cd ../.. && pnpm dev            # API :3000, web :5173, Caddy proxy
```

| Service     | URL                                        |
| ----------- | ------------------------------------------ |
| Web app     | https://app.meetnotes.localhost            |
| API         | https://api.meetnotes.localhost            |
| Swagger     | https://api.meetnotes.localhost/api        |
| Bull Board  | https://api.meetnotes.localhost/queues     |
| Mailpit     | https://mailbox.meetnotes.localhost        |
| RustFS UI   | https://storage.meetnotes.localhost        |

Sign up, open **Meetings**, drop in an MP3/MP4 and watch the timeline. With the default `.env` the mock adapters finish in a few seconds and produce a fake (but structurally complete) transcript, speakers, summary, action items and decisions.

## Configuration

Both apps read `.env` files derived from their `.env.example` (never commit `.env`). Every variable is validated at boot in `apps/api/src/common/configuration/*.ts`; a missing required value stops the API with a readable error.

### API (`apps/api/.env`)

| Group | Variables | Notes |
| ----- | --------- | ----- |
| General | `NODE_ENV`, `PORT` (default `3000`), `LOG_LEVEL`, `CORS_ORIGIN`, `COOKIE_DOMAIN` | `CORS_ORIGIN`/`COOKIE_DOMAIN` are used in production; in development the API trusts `localhost:5173` and `app.meetnotes.localhost`. |
| Database | `DATABASE_URL`, `DATABASE_TEST_URL` | Postgres from `docker-compose.yml` (`meeting_notes` and `meeting_notes_test`, created by `database-init.sql`). |
| Queue | `REDIS_URL`, `BULLBOARD_PASSWORD` | Redis for BullMQ; Bull Board at `/queues` with user `admin`. |
| Object storage | `FILE_STORAGE_ADAPTER=s3`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`, `S3_ENDPOINT`, `S3_PUBLIC_ENDPOINT`, `S3_FORCE_PATH_STYLE` | Defaults point at RustFS from compose (`rustfsadmin` / `rustfsadmin`, bucket `meeting-notes-media`). Any S3-compatible bucket works. `S3_PUBLIC_ENDPOINT` is the host embedded in signed playback URLs. |
| Uploads | `MAX_UPLOAD_MB` | Server-side cap for the upload endpoint (default 500). |
| AI pipeline | `TRANSCRIPTION_ADAPTER`, `DIARIZATION_ADAPTER`, `SUMMARY_ADAPTER` + provider keys | See [AI adapters](#ai-adapters). |
| Auth | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Better Auth (email + password, Google OAuth, admin plugin). The Google values must be present even if you do not use Google login; the example placeholders are fine locally. |
| Email | `EMAIL_ADAPTER` (`mailhog` \| `smtp` \| `ses` \| `ci`), `SMTP_*` | Password reset / welcome emails. Local dev uses Mailpit at `localhost:8025`. |

### Web (`apps/web-app/.env`)

| Variable | Notes |
| -------- | ----- |
| `VITE_API_URL` | API origin, e.g. `https://api.meetnotes.localhost` (or `http://localhost:3000` without Caddy). |
| `VITE_MAX_UPLOAD_MB` | Client-side size check; keep equal to `MAX_UPLOAD_MB`. |

## AI adapters

Set these in `apps/api/.env`:

| Variable                | Values                               | Notes |
| ----------------------- | ------------------------------------ | ----- |
| `TRANSCRIPTION_ADAPTER` | `mock` \| `openai` \| `local`        | `openai` = Whisper via `POST /v1/audio/transcriptions` (`OPENAI_API_KEY`, `OPENAI_WHISPER_MODEL`, ≤ 25 MB per file). `local` = the open-source [`whisper`](https://github.com/openai/whisper) CLI on the worker host (`LOCAL_WHISPER_BINARY`, `LOCAL_WHISPER_MODEL`), no size limit, needs Python + ffmpeg. |
| `DIARIZATION_ADAPTER`   | `heuristic` \| `claude` \| `pyannote` | `heuristic` alternates speakers on pauses/questions (no deps). `claude` infers turns from the text with Claude. `pyannote` posts the audio to `DIARIZATION_SERVICE_URL` and expects `{ "segments": [{ "start", "end", "speaker" }] }` — wrap [pyannote.audio](https://github.com/pyannote/pyannote-audio) in any small HTTP service. |
| `SUMMARY_ADAPTER`       | `mock` \| `claude`                   | `claude` uses the Anthropic SDK with **structured outputs** (`output_config.format = json_schema`) validated against the same TypeBox schema the API serves. `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (default `claude-opus-5`). |
| `MAX_UPLOAD_MB`         | number (default 500)                 | Upload cap; mirror it in `VITE_MAX_UPLOAD_MB` for the client-side check. |

Recommended real-world setup: `TRANSCRIPTION_ADAPTER=openai` (or `local` for long files), `DIARIZATION_ADAPTER=claude`, `SUMMARY_ADAPTER=claude`.

Adapters live in `apps/api/src/ai/` behind three abstract classes (`TranscriptionProvider`, `DiarizationProvider`, `SummaryProvider`); adding e.g. Deepgram or AssemblyAI is one file plus a `case` in `ai.module.ts`.

## Monorepo layout

| Path                          | Description |
| ----------------------------- | ----------- |
| `apps/api`                    | NestJS API + BullMQ worker (`meeting-notes-api`). |
| `apps/api/src/meetings`       | Upload endpoint, meeting CRUD, queue producer/consumer, pipeline stages, Markdown export. |
| `apps/api/src/ai`             | Transcription / diarization / summary adapters and the Claude client. |
| `apps/api/src/file-storage`   | S3 adapter (upload, streaming download, signed playback URLs). |
| `apps/web-app`                | React Router 7 SPA (`meeting-notes-web-app`). |
| `apps/web-app/app/modules/dashboard/meetings` | Upload dropzone, meetings table, processing timeline, transcript/summary views. |
| `apps/web-app/app/api`        | Generated Swagger client + react-query hooks. |
| `apps/reverse-proxy`          | Caddy config for `*.meetnotes.localhost`. |
| `packages/*`                  | Shared ESLint/TS configs, email templates, shared utils (from the boilerplate). |

## API

All routes are versioned under `/api/v1` and require a Better Auth session cookie. Full OpenAPI at `/api`.

| Method | Path                          | Purpose |
| ------ | ----------------------------- | ------- |
| POST   | `/meetings`                   | `multipart/form-data`: `file` (audio/video), optional `title`, `language` (ISO-639-1). Stores the file, creates the meeting, enqueues `TRANSCRIBE`. |
| GET    | `/meetings`                   | Current user's meetings (list view, no transcript). |
| GET    | `/meetings/:id`               | Full meeting: status, progress, transcript, speakers, summary, key topics, action items, decisions. |
| PATCH  | `/meetings/:id`               | Rename the meeting and/or speakers (`{ speakers: { SPEAKER_00: "Ola" } }`). |
| POST   | `/meetings/:id/retry`         | Re-enqueue a `failed` meeting from the stage that failed. |
| GET    | `/meetings/:id/media-url`     | Signed URL (1 h) for in-browser playback. |
| GET    | `/meetings/:id/export`        | `text/markdown` document with notes and transcript. |
| DELETE | `/meetings/:id`               | Delete the meeting and its recording. |

After changing DTOs run the API once, then `pnpm generate:client` to refresh `apps/web-app/app/api/generated-api.ts`.

## Tooling commands

| Task                    | Command |
| ----------------------- | ------- |
| Everything in dev       | `pnpm dev` |
| API / web only          | `pnpm --filter meeting-notes-api dev` / `pnpm --filter meeting-notes-web-app dev` |
| New migration           | `pnpm db:generate -- --name <name>` then `pnpm db:migrate` |
| Regenerate API client   | `pnpm generate:client` |
| Lint / format           | `pnpm lint` / `pnpm format` |
| Typecheck API           | `pnpm typecheck:api` |

## Testing

```sh
pnpm test:api        # unit: adapters, heuristic diarization, Markdown export (no infra needed)
pnpm test:api:e2e    # needs Postgres + Redis from docker compose; runs the whole pipeline with mock adapters
pnpm test:web        # vitest + testing-library
```

The e2e suite (`apps/api/src/meetings/__tests__/meetings.controller.e2e-spec.ts`) uploads a fake recording, waits for the three queue jobs to complete through the real BullMQ worker, then asserts the transcript, speakers, summary, export and ownership rules. Object storage is swapped for an in-memory adapter.

## Production notes

- Run migrations with the API image: `entrypoint.sh migrate`.
- The worker runs inside the API process (BullMQ consumer, concurrency 2). To scale processing separately, start additional API replicas — or split `MeetingsProcessingConsumer` into its own Nest app; everything it needs is already in `MeetingsModule`.
- `local` Whisper needs Python, `openai-whisper` and ffmpeg in the worker image; `openai` Whisper needs nothing but a key and files ≤ 25 MB.
- Signed playback URLs embed `S3_PUBLIC_ENDPOINT` (falls back to `S3_ENDPOINT`); point it at the bucket host the browser can reach.
- GitHub Actions lint/test on PRs and build/deploy on `main` (AWS scaffolding from the boilerplate, adjust secrets before enabling).
- Recordings are private objects; the browser only ever receives 1-hour signed URLs. Deleting a meeting deletes the object and soft-deletes the `file` row.

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| `EADDRINUSE :::3000` on `pnpm dev` | Something else owns the port. Run the API with `PORT=3999 pnpm --filter meeting-notes-api dev` and point `VITE_API_URL` at it, or free the port. |
| Browser rejects `*.meetnotes.localhost` certificates | Run `caddy run` once inside `apps/reverse-proxy` and accept the trust prompt (installs Caddy's local CA). |
| API starts but every request logs `ECONNREFUSED 6379` / DB errors | `docker compose up -d` is not running, or `REDIS_URL` / `DATABASE_URL` point elsewhere. |
| Meeting ends in `failed` at `transcribe` with "accepts at most 25 MB" | The OpenAI Whisper endpoint limit. Use `TRANSCRIPTION_ADAPTER=local`, or compress the recording to a low-bitrate audio track first. |
| `failed` at `transcribe` with "Failed to start whisper" | `local` adapter needs `pip install openai-whisper` and `ffmpeg` on the worker host; or set `LOCAL_WHISPER_BINARY` to the full path. |
| `failed` at `summarize` with "Claude output did not match schema" / auth errors | Check `ANTHROPIC_API_KEY`; the job retries 3 times, then use **Retry from this step** in the UI (transcription is kept). |
| Playback shows "Media preview is unavailable" | The signed URL points at `S3_PUBLIC_ENDPOINT`; make sure the browser can reach that host (for RustFS in compose: `http://127.0.0.1:9000`). |
| `pnpm generate:client` produces stale types | The Swagger file is written when the API boots. Start the API once after changing DTOs, then regenerate. |
| Google login button errors | Expected without real `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`; email + password login works with the placeholders. |

## License & credits

Application code is released under the terms in [`LICENSE`](./LICENSE). The project structure, auth, storage and tooling come from the MIT-licensed [Selleo boilerplate](https://github.com/Selleo/boilerplate); transcription uses [Whisper](https://github.com/openai/whisper) (OpenAI API or the open-source CLI) and notes are generated with Claude via the [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript).
