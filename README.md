# Partybox

A Jackbox-inspired web party game platform MVP.

- One host browser for the TV
- Multiple player phones join with a room code/link
- Realtime WebSocket updates via Socket.IO
- First playable game: **Prompt Battle** — answer a prompt, reveal answers, vote, score rounds

## Run locally

```bash
npm install
npm run dev
```

Open:

- Host/player app: http://localhost:5173
- Realtime health: http://localhost:3001/health

## Gameplay loop

1. Host creates a room.
2. Players join with the 4-character room code.
3. Host starts once 2+ players are in.
4. Players submit answers privately.
5. Host reveals answers on the TV.
6. Players vote on phones.
7. Scores update and rounds continue.

## Architecture

- `src/server/index.ts` — Socket.IO server, in-memory rooms, game state machine
- `src/client/main.tsx` — React host/player app
- `src/shared/types.ts` — shared client/server event and state types

This is intentionally simple and single-node. If it gets real traffic, the next move is Redis-backed room state / Socket.IO adapter and a game-module interface.
