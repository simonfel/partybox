import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, PublicRoomState, ServerToClientEvents } from '../shared/types';
import './styles.css';

type PartySocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const socket: PartySocket = io(import.meta.env.DEV ? 'http://localhost:3001' : undefined, {
  transports: ['websocket', 'polling'],
});

function App() {
  const [room, setRoom] = useState<PublicRoomState | null>(null);
  const [role, setRole] = useState<'home' | 'host' | 'player'>('home');
  const [playerId, setPlayerId] = useState<string | null>(() => localStorage.getItem('partybox.playerId'));
  const [playerName, setPlayerName] = useState<string>(() => localStorage.getItem('partybox.playerName') ?? '');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    socket.on('roomState', setRoom);
    socket.on('hostJoined', ({ roomCode }) => {
      setRole('host');
      localStorage.setItem('partybox.hostRoom', roomCode);
    });
    socket.on('joined', ({ playerId, playerName }) => {
      setRole('player');
      setPlayerId(playerId);
      setPlayerName(playerName);
      localStorage.setItem('partybox.playerId', playerId);
      localStorage.setItem('partybox.playerName', playerName);
    });
    socket.on('errorMessage', (message) => {
      setError(message);
      window.setTimeout(() => setError(''), 3000);
    });
    return () => {
      socket.off('roomState');
      socket.off('hostJoined');
      socket.off('joined');
      socket.off('errorMessage');
    };
  }, []);

  const roomFromUrl = useMemo(() => new URLSearchParams(window.location.search).get('room')?.toUpperCase() ?? '', []);

  return (
    <main className="app">
      {error ? <div className="toast">{error}</div> : null}
      {role === 'home' ? <Home roomFromUrl={roomFromUrl} onHost={() => socket.emit('createRoom')} /> : null}
      {role === 'host' && room ? <HostView room={room} /> : null}
      {role === 'player' && room ? <PlayerView room={room} playerId={playerId} playerName={playerName} /> : null}
    </main>
  );
}

function Home({ roomFromUrl, onHost }: { roomFromUrl: string; onHost: () => void }) {
  const [roomCode, setRoomCode] = useState(roomFromUrl);
  const [name, setName] = useState(localStorage.getItem('partybox.playerName') ?? '');

  function join(e: FormEvent) {
    e.preventDefault();
    socket.emit('joinPlayer', { roomCode, playerName: name });
  }

  return (
    <section className="home card">
      <p className="eyebrow">Jackbox-ish web party games</p>
      <h1>Partybox</h1>
      <p className="lede">One browser on the TV. Everyone else plays from their phone. First game: Prompt Battle.</p>
      <div className="split">
        <button className="primary huge" onClick={onHost}>Host a game</button>
        <form onSubmit={join} className="joinForm">
          <label>
            Room code
            <input value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} maxLength={4} placeholder="ABCD" />
          </label>
          <label>
            Your name
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder="Alex" />
          </label>
          <button className="secondary" type="submit">Join</button>
        </form>
      </div>
    </section>
  );
}

function HostView({ room }: { room: PublicRoomState }) {
  const joinUrl = `${window.location.origin}?room=${room.code}`;
  const canStart = room.players.length >= 2 && room.phase === 'lobby';
  const submitted = room.players.filter((p) => p.hasSubmitted).length;
  const voted = room.players.filter((p) => p.hasVoted).length;

  return (
    <section className="hostShell">
      <header className="hostHeader">
        <div>
          <p className="eyebrow">Room code</p>
          <h1 className="roomCode">{room.code}</h1>
        </div>
        <div className="joinBox">
          <span>Players join:</span>
          <strong>{joinUrl}</strong>
        </div>
      </header>

      {room.phase === 'lobby' ? (
        <div className="card center">
          <h2>Lobby</h2>
          <PlayerGrid room={room} />
          <button className="primary" disabled={!canStart} onClick={() => socket.emit('startGame')}>
            {canStart ? 'Start Prompt Battle' : 'Need 2+ players'}
          </button>
        </div>
      ) : null}

      {room.phase === 'prompt' ? (
        <Stage title={`Round ${room.round}/${room.maxRounds}`} subtitle={room.prompt}>
          <div className="meter"><span style={{ width: `${(submitted / Math.max(1, room.players.length)) * 100}%` }} /></div>
          <p>{submitted}/{room.players.length} answers submitted</p>
        </Stage>
      ) : null}

      {room.phase === 'reveal' ? (
        <Stage title="The answers are in" subtitle={room.prompt}>
          <AnswerWall room={room} showVotes={false} />
          <button className="primary" onClick={() => socket.emit('next')}>Open voting</button>
        </Stage>
      ) : null}

      {room.phase === 'voting' ? (
        <Stage title="Vote on your phones" subtitle={room.prompt}>
          <AnswerWall room={room} showVotes />
          <p>{voted}/{room.players.length} votes cast</p>
        </Stage>
      ) : null}

      {room.phase === 'results' || room.phase === 'gameOver' ? (
        <Stage title={room.phase === 'gameOver' ? 'Final scores' : 'Round results'} subtitle={room.winnerIds.length ? 'Big points for the crowd favourite.' : 'No votes? Stone cold room.'}>
          <AnswerWall room={room} showVotes />
          <Scoreboard room={room} />
          <button className="primary" onClick={() => socket.emit('next')}>
            {room.phase === 'gameOver' ? 'Back to lobby' : 'Next round'}
          </button>
        </Stage>
      ) : null}
    </section>
  );
}

function PlayerView({ room, playerId, playerName }: { room: PublicRoomState; playerId: string | null; playerName: string }) {
  const [answer, setAnswer] = useState('');
  const me = room.players.find((player) => player.id === playerId);
  const otherAnswers = room.answers.filter((item) => item.playerId !== playerId);

  function submit(e: FormEvent) {
    e.preventDefault();
    socket.emit('submitAnswer', answer);
    setAnswer('');
  }

  return (
    <section className="phone card">
      <p className="eyebrow">{playerName} · {room.code}</p>
      {room.phase === 'lobby' ? <><h1>You’re in.</h1><p>Look at the TV — the host will start soon.</p></> : null}
      {room.phase === 'prompt' ? (
        <>
          <h2>{room.prompt}</h2>
          {me?.hasSubmitted ? <p className="done">Answer locked. Nicely done.</p> : (
            <form onSubmit={submit} className="answerForm">
              <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} maxLength={120} autoFocus placeholder="Type something unhinged…" />
              <button className="primary" type="submit">Submit</button>
            </form>
          )}
        </>
      ) : null}
      {room.phase === 'reveal' ? <><h1>Answers revealed</h1><p>Enjoy the chaos on the TV.</p></> : null}
      {room.phase === 'voting' ? (
        <>
          <h2>Pick your favourite</h2>
          {me?.hasVoted ? <p className="done">Vote locked.</p> : (
            <div className="voteList">
              {otherAnswers.map((item) => <button key={item.id} onClick={() => socket.emit('vote', item.id)}>{item.text}</button>)}
            </div>
          )}
        </>
      ) : null}
      {room.phase === 'results' || room.phase === 'gameOver' ? (
        <>
          <h1>{room.phase === 'gameOver' ? 'Game over' : 'Results'}</h1>
          <p>Your score: <strong>{me?.score ?? 0}</strong></p>
          <Scoreboard room={room} compact />
        </>
      ) : null}
    </section>
  );
}

function Stage({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="card center stage"><p className="eyebrow">Prompt Battle</p><h2>{title}</h2><p className="prompt">{subtitle}</p>{children}</div>;
}

function PlayerGrid({ room }: { room: PublicRoomState }) {
  return <div className="players">{room.players.map((player) => <div className="player" key={player.id}>{player.connected ? '🟢' : '⚫'} {player.name}<strong>{player.score}</strong></div>)}</div>;
}

function AnswerWall({ room, showVotes }: { room: PublicRoomState; showVotes: boolean }) {
  return <div className="answers">{room.answers.map((answer) => <article className={room.winnerIds.includes(answer.playerId) ? 'answer winner' : 'answer'} key={answer.id}><p>{answer.text}</p><footer>{answer.playerName}{showVotes ? <strong>{answer.votes.length} votes</strong> : null}</footer></article>)}</div>;
}

function Scoreboard({ room, compact = false }: { room: PublicRoomState; compact?: boolean }) {
  return <div className={compact ? 'scoreboard compact' : 'scoreboard'}>{room.players.map((player, index) => <div key={player.id}><span>{index + 1}. {player.name}</span><strong>{player.score}</strong></div>)}</div>;
}

createRoot(document.getElementById('root')!).render(<App />);
