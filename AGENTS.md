# Partyroom development

Target stack: React + TypeScript + Vite on Vercel; Convex for persistent rooms and authoritative rules. This is a clean replacement, not an extension of the old Socket.IO prototype.

Keep unrevealed answers, bearer tokens, future matchups, and voter identity out of public projections. Room codes grant joining, never host authority. Preserve resumable player sessions. Use server deadlines and stale-job guards. Repeated or stale client commands must not duplicate scoring.

Build order: shared shell + Punchline; Ship Happens; Last Call. Use original names, writing, art, and audio. Keep upcoming games visibly unavailable until implemented.

Run `npm test` and `npm run build` for rules/backend changes. Do not claim multi-device or production validation from the in-memory harness. Do not commit environment secrets. Record concrete limitations in README and the issue drafts.
