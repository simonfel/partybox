export type Phase = 'lobby' | 'prompt' | 'reveal' | 'voting' | 'results' | 'gameOver';

export type Player = {
  id: string;
  name: string;
  score: number;
  connected: boolean;
  hasSubmitted: boolean;
  hasVoted: boolean;
};

export type Answer = {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  votes: string[];
};

export type PublicRoomState = {
  code: string;
  phase: Phase;
  round: number;
  maxRounds: number;
  prompt: string;
  players: Player[];
  answers: Answer[];
  countdownEndsAt?: number;
  winnerIds: string[];
};

export type ClientRole = 'host' | 'player';

export type ServerToClientEvents = {
  roomState: (state: PublicRoomState) => void;
  joined: (payload: { roomCode: string; playerId: string; playerName: string }) => void;
  hostJoined: (payload: { roomCode: string }) => void;
  errorMessage: (message: string) => void;
};

export type ClientToServerEvents = {
  createRoom: () => void;
  joinHost: (roomCode: string) => void;
  joinPlayer: (payload: { roomCode: string; playerName: string }) => void;
  startGame: () => void;
  submitAnswer: (answer: string) => void;
  vote: (answerId: string) => void;
  next: () => void;
  resetRoom: () => void;
};
