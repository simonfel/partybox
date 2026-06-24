import express from 'express';
import { existsSync } from 'fs';
import { createServer } from 'http';
import { join } from 'path';
import { Server } from 'socket.io';
import type {
  Answer,
  ClientToServerEvents,
  Player,
  PublicRoomState,
  ServerToClientEvents,
} from '../shared/types';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

const prompts = [
  'The worst possible thing to hear from your smart fridge',
  'A terrible name for a startup that somehow raised $50M',
  'The real reason dinosaurs went extinct',
  'A warning label that should come with every group chat',
  'A rejected feature from the next iPhone',
  'Something you should never say while holding a microphone',
  'The most cursed thing to find in an Airbnb drawer',
  'A product Shopify merchants definitely should not sell',
  'The title of a children’s book written by a supervillain',
  'A weird flex, but okay',
];

type Room = {
  code: string;
  hostSocketId?: string;
  phase: PublicRoomState['phase'];
  round: number;
  maxRounds: number;
  prompt: string;
  promptIndex: number;
  players: Map<string, Player>;
  socketToPlayer: Map<string, string>;
  answers: Answer[];
  winnerIds: string[];
};

const rooms = new Map<string, Room>();

function roomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function createRoom(): Room {
  const code = roomCode();
  const room: Room = {
    code,
    phase: 'lobby',
    round: 0,
    maxRounds: 3,
    prompt: '',
    promptIndex: Math.floor(Math.random() * prompts.length),
    players: new Map(),
    socketToPlayer: new Map(),
    answers: [],
    winnerIds: [],
  };
  rooms.set(code, room);
  return room;
}

function serialize(room: Room): PublicRoomState {
  return {
    code: room.code,
    phase: room.phase,
    round: room.round,
    maxRounds: room.maxRounds,
    prompt: room.prompt,
    players: Array.from(room.players.values()).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)),
    answers: room.phase === 'prompt' ? [] : room.answers,
    winnerIds: room.winnerIds,
  };
}

function emitRoom(room: Room) {
  io.to(room.code).emit('roomState', serialize(room));
}

function findRoomBySocket(socketId: string) {
  for (const room of rooms.values()) {
    if (room.hostSocketId === socketId || room.socketToPlayer.has(socketId)) return room;
  }
  return undefined;
}

function resetRoundFlags(room: Room) {
  for (const player of room.players.values()) {
    player.hasSubmitted = false;
    player.hasVoted = false;
  }
}

function startRound(room: Room) {
  room.phase = 'prompt';
  room.round += 1;
  room.answers = [];
  room.winnerIds = [];
  room.prompt = prompts[room.promptIndex % prompts.length];
  room.promptIndex += 1;
  resetRoundFlags(room);
  emitRoom(room);
}

function maybeAdvanceAfterSubmissions(room: Room) {
  const activePlayers = Array.from(room.players.values()).filter((player) => player.connected);
  if (activePlayers.length > 0 && activePlayers.every((player) => player.hasSubmitted)) {
    room.phase = 'reveal';
    emitRoom(room);
  }
}

function maybeAdvanceAfterVotes(room: Room) {
  const activePlayers = Array.from(room.players.values()).filter((player) => player.connected);
  if (activePlayers.length > 0 && activePlayers.every((player) => player.hasVoted)) {
    finishVoting(room);
  }
}

function finishVoting(room: Room) {
  for (const answer of room.answers) {
    const player = room.players.get(answer.playerId);
    if (player) player.score += answer.votes.length * 100;
  }
  const highestVotes = Math.max(0, ...room.answers.map((answer) => answer.votes.length));
  room.winnerIds = highestVotes > 0 ? room.answers.filter((answer) => answer.votes.length === highestVotes).map((answer) => answer.playerId) : [];
  room.phase = room.round >= room.maxRounds ? 'gameOver' : 'results';
  emitRoom(room);
}

const app = express();
app.get('/health', (_req, res) => res.json({ ok: true, rooms: rooms.size }));

const clientDist = join(process.cwd(), 'dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/.*/, (_req, res) => res.sendFile(join(clientDist, 'index.html')));
}

const server = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: { origin: '*' },
});

io.on('connection', (socket) => {
  socket.on('createRoom', () => {
    const room = createRoom();
    room.hostSocketId = socket.id;
    socket.join(room.code);
    socket.emit('hostJoined', { roomCode: room.code });
    emitRoom(room);
  });

  socket.on('joinHost', (rawCode) => {
    const room = rooms.get(rawCode.toUpperCase());
    if (!room) return socket.emit('errorMessage', 'Room not found.');
    room.hostSocketId = socket.id;
    socket.join(room.code);
    socket.emit('hostJoined', { roomCode: room.code });
    emitRoom(room);
  });

  socket.on('joinPlayer', ({ roomCode, playerName }) => {
    const room = rooms.get(roomCode.toUpperCase());
    if (!room) return socket.emit('errorMessage', 'Room not found.');
    if (room.phase !== 'lobby') return socket.emit('errorMessage', 'That game already started.');

    const cleanName = playerName.trim().slice(0, 24) || 'Player';
    const player: Player = {
      id: id('player'),
      name: cleanName,
      score: 0,
      connected: true,
      hasSubmitted: false,
      hasVoted: false,
    };
    room.players.set(player.id, player);
    room.socketToPlayer.set(socket.id, player.id);
    socket.join(room.code);
    socket.emit('joined', { roomCode: room.code, playerId: player.id, playerName: player.name });
    emitRoom(room);
  });

  socket.on('startGame', () => {
    const room = findRoomBySocket(socket.id);
    if (!room || room.hostSocketId !== socket.id) return;
    if (room.players.size < 2) return socket.emit('errorMessage', 'You need at least 2 players.');
    room.round = 0;
    for (const player of room.players.values()) player.score = 0;
    startRound(room);
  });

  socket.on('submitAnswer', (rawAnswer) => {
    const room = findRoomBySocket(socket.id);
    if (!room || room.phase !== 'prompt') return;
    const playerId = room.socketToPlayer.get(socket.id);
    if (!playerId) return;
    const player = room.players.get(playerId);
    if (!player || player.hasSubmitted) return;

    const answer = rawAnswer.trim().slice(0, 120);
    if (!answer) return socket.emit('errorMessage', 'Answer cannot be empty.');

    player.hasSubmitted = true;
    room.answers.push({ id: id('answer'), playerId, playerName: player.name, text: answer, votes: [] });
    emitRoom(room);
    maybeAdvanceAfterSubmissions(room);
  });

  socket.on('vote', (answerId) => {
    const room = findRoomBySocket(socket.id);
    if (!room || room.phase !== 'voting') return;
    const voterId = room.socketToPlayer.get(socket.id);
    if (!voterId) return;
    const voter = room.players.get(voterId);
    if (!voter || voter.hasVoted) return;
    const answer = room.answers.find((item) => item.id === answerId);
    if (!answer) return;
    if (answer.playerId === voterId) return socket.emit('errorMessage', 'No voting for yourself, you gremlin.');

    answer.votes.push(voterId);
    voter.hasVoted = true;
    emitRoom(room);
    maybeAdvanceAfterVotes(room);
  });

  socket.on('next', () => {
    const room = findRoomBySocket(socket.id);
    if (!room || room.hostSocketId !== socket.id) return;
    if (room.phase === 'reveal') {
      room.phase = 'voting';
      for (const player of room.players.values()) player.hasVoted = false;
      emitRoom(room);
      return;
    }
    if (room.phase === 'results') {
      startRound(room);
      return;
    }
    if (room.phase === 'gameOver') {
      room.phase = 'lobby';
      room.round = 0;
      room.prompt = '';
      room.answers = [];
      room.winnerIds = [];
      resetRoundFlags(room);
      emitRoom(room);
    }
  });

  socket.on('resetRoom', () => {
    const room = findRoomBySocket(socket.id);
    if (!room || room.hostSocketId !== socket.id) return;
    room.phase = 'lobby';
    room.round = 0;
    room.prompt = '';
    room.answers = [];
    room.winnerIds = [];
    for (const player of room.players.values()) {
      player.score = 0;
      player.hasSubmitted = false;
      player.hasVoted = false;
    }
    emitRoom(room);
  });

  socket.on('disconnect', () => {
    const room = findRoomBySocket(socket.id);
    if (!room) return;
    const playerId = room.socketToPlayer.get(socket.id);
    if (playerId) {
      const player = room.players.get(playerId);
      if (player) player.connected = false;
      room.socketToPlayer.delete(socket.id);
    }
    if (room.hostSocketId === socket.id) room.hostSocketId = undefined;
    emitRoom(room);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Partybox realtime server listening on http://${HOST}:${PORT}`);
});
