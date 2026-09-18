# meeting-notes-web-app

React Router 7 single-page app for MeetNotes: upload meeting recordings, watch the background pipeline progress, and read transcripts, summaries, action items and decisions.

- `app/modules/dashboard/meetings` — meetings list with upload dropzone, meeting details (processing timeline, media player, tabs, speaker renaming, Markdown export).
- `app/api` — generated Swagger client (`generated-api.ts`, do not edit by hand) and react-query hooks (`queries/`, `mutations/`).
- `app/modules/Auth` — sign in / sign up / password reset screens (Better Auth).
- `app/locales` — `en` and `pl` translations (i18next).

```sh
pnpm --filter meeting-notes-web-app dev        # http://localhost:5173
pnpm --filter meeting-notes-web-app typecheck  # react-router typegen + tsc
pnpm test:web
pnpm generate:client                            # after the API has booted once
```

Environment: `VITE_API_URL` (API origin) and `VITE_MAX_UPLOAD_MB` (client-side upload limit). See the root [README](../../README.md) for the full setup.
