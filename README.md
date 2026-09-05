# Partyroom

A fresh replacement for the Partybox prototype: a shared TV screen, private phone controllers, and original party games. The repository remains `simonfel/partybox`; Partyroom is a working product name.

## Status

Implemented: React frontend, Convex room persistence and scheduled deadlines, guest bearer sessions, QR joining, ready lobby, and **Punchline**, an original paired-answer comedy game. Production build and automated rules/backend checks are the initial quality gates. No live Convex or Vercel deployment has been provisioned. Multi-device and browser playtesting remain required.

**Ship Happens** (guided joke writing) and **Last Call** (personalized horror trivia) are planned, not playable. Their cards are explicitly marked as upcoming. See `docs/issues/` for the six milestones and acceptance criteria.

## Run

Requires Node 22+ and a Convex account/project.

```sh
npm ci
npx convex dev
```

Complete the Convex project setup. Keep its process running to publish backend updates. Copy the deployment URL into `.env.local`:

```dotenv
VITE_CONVEX_URL=https://YOUR-DEPLOYMENT.convex.cloud
```

In a second terminal:

```sh
npm run dev
```

The app deliberately shows setup instructions if no backend URL is configured. It does not pretend that local browser state supports multiplayer.

## Play

1. Open the site on a laptop and select **Host a night**. Show that browser on your TV with HDMI or screen mirroring.
2. Players scan the QR or enter the five-character room code and a name. No accounts.
3. Use 3–8 players. Everyone presses **I'm ready**. The host may also take a seat.
4. Choose 1–3 rounds and 60, 120, 180, or 300 seconds to write.
5. Each player answers two prompts. The game moves on when all answers arrive or the server deadline expires.
6. The host opens voting for each matchup. Authors sit out. Each eligible vote is worth 100 points. Ties simply retain equal vote-based scores; a missing answer makes that matchup a no-contest.
7. After the final results, return to the same lobby. Players keep their sessions.

Host controls currently stay on the original host browser. Pairing a second phone for host controls is a tracked follow-up. Player sessions survive refresh on their original browser; clearing storage loses that identity. Rooms expire 24 hours after creation. In-progress disconnected players time out normally; lobby removal is supported.

## Deploy on Vercel + Convex

1. Import this repo into Vercel using the Vite preset. `vercel.json` supplies the build and SPA rewrite.
2. Run `npx convex deploy` against your selected production Convex project.
3. Set Vercel's `VITE_CONVEX_URL` to that production deployment's URL and deploy the frontend.
4. Use a separate Convex dev deployment for development/preview branches. Do not casually point previews at production.
5. Run the real-device checklist in `docs/issues/03.md` and `06.md` before calling the game ready for a group.

The frontend URL is public configuration. Do not expose Convex deploy keys or host/player tokens. Host authority uses a separate 256-bit random browser token; the room code is only an invitation to join.

## Architecture

- `src/engine.ts`: pure state machine and role-specific projections.
- `convex/rooms.ts`: validated public mutations/queries, transactional state changes, scheduled timeouts and cleanup.
- `convex/schema.ts`: indexed persistent rooms. Private state is stored as a JSON document for this initial slice; only `project()` is returned publicly.
- `src/api.ts`: typed function references independent of generated deployment bindings.
- `src/main.tsx`: home, lobby, controllers, display, and host controls.
- `tests/`: rule invariants and Convex integration tests.

The server owns scoring and time. Clients submit an epoch with each command; stale rounds are rejected. Scheduled jobs check both phase epoch and deadline, so old jobs cannot cut short a resumed or extended round. Votes arrive as A/B choices and map to authors on the backend. No unrevealed answers, host tokens, voter identities, or future matchups are returned to other clients.

The prompt corpus is 24 original prompts, enough for three rounds at eight players. Prompt order is deterministic in this first build; richer packs, shuffling, and custom prompts are follow-ups. Live AI generation is not part of this slice.

## Validate

```sh
npm test
npm run build
```

GitHub Actions runs both. Backend tests use Convex's in-memory test harness; they do not establish that a production deployment is healthy.

## Remaining before broad release

Public room-creation abuse limits; real connection-presence indicators and host handling of dropouts; separate-device host pairing; browser/TV QA; sound; customizable prompts; game-module extraction when adding the second game. No claim of public-production readiness is made.

## Publish the prepared issues

With GitHub CLI installed and authenticated with issue-write access:

```sh
npm run issues:publish -- simonfel/partybox
```

The publisher skips matching titles and stops on failure. The milestones are tracked in GitHub Issues. Markdown copies are retained here, and the publisher skips existing matching titles.
