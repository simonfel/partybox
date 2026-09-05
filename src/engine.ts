/** Pure authoritative rules. Clients receive project(), never Room. */
export type Phase = 'lobby' | 'writing' | 'reveal' | 'voting' | 'results' | 'finished';
export type Player = { id: string; token: string; name: string; score: number; ready: boolean };
export type Match = { prompt: string; authors: [string, string]; answers: Record<string,string>; votes: Record<string,string> };
export type Room = { code: string; hostToken: string; players: Player[]; phase: Phase; round: number; matchIndex: number; matches: Match[]; epoch: number; deadline: number | null; remaining: number | null; seconds: number; rounds: number };
export const prompts = [
 'The worst slogan for a luxury hotel on the moon.',
 'An absolutely unnecessary feature on a smart toaster.',
 'The one thing you should never put on a wedding invitation.',
 'A suspiciously specific rule at your new gym.',
 'The least convincing excuse for arriving three hours early.',
 'A terrible name for a very expensive candle.',
 'The first complaint in a restaurant run by raccoons.',
 'A motivational quote that would get you fired.',
 'Something a haunted fridge would whisper at midnight.',
 'The title of a reality show about your group chat.',
 'An alarming notification from your houseplants.',
 'The worst possible prize for winning a talent show.',
 'A rejected Olympic event that you would absolutely win.',
 'The real reason your printer refuses to cooperate.',
 'The most awkward thing a fortune cookie could predict.',
 'An unexpected item on a billionaire’s grocery list.',
 'A warning label that should come with adulthood.',
 'The least useful superpower at a dinner party.',
 'The password a pirate keeps forgetting.',
 'An apology that somehow makes everything worse.',
 'A terrible opening line for a museum audio guide.',
 'The secret ingredient in the world’s worst energy drink.',
 'Something you do not want your dentist to announce.',
 'The slogan for a vacation you will definitely regret.',
];
function fail(message: string): never { throw new Error(message); }
export function create(code: string, token: string): Room {
 return {code,hostToken:token,players:[],phase:'lobby',round:0,matchIndex:0,matches:[],epoch:0,deadline:null,remaining:null,seconds:120,rounds:3};
}
export function player(room:Room, token:string) { return room.players.find(p=>p.token===token); }
function host(room:Room,token:string) { if(token!==room.hostToken) fail('Only the host can do that.'); }
function phase(room:Room,next:Phase,now:number,seconds?:number) { room.phase=next;room.epoch++;room.deadline=seconds ? now+seconds*1000:null;room.remaining=null; }
function beginRound(room:Room,now:number) {
 room.round++;room.matchIndex=0;
 room.matches=room.players.map((p,i)=>({prompt:prompts[((room.round-1)*room.players.length+i)%prompts.length],authors:[p.id,room.players[(i+1)%room.players.length].id],answers:{},votes:{}}));
 phase(room,'writing',now,room.seconds);
}
export type Command =
 | {type:'join'; name:string}
 | {type:'ready'; ready:boolean}
 | {type:'settings'; seconds:number; rounds:number}
 | {type:'start'} | {type:'next'} | {type:'pause'} | {type:'resume'} | {type:'extend'} | {type:'lobby'}
 | {type:'remove'; playerId:string}
 | {type:'answer'; match:number; text:string}
 | {type:'vote'; choice:string};
function tally(room:Room,now:number) {
 const m=room.matches[room.matchIndex];
 for(const author of m.authors) {
  const p=room.players.find(p=>p.id===author)!;
  p.score+=Object.values(m.votes).filter(v=>v===author).length*100;
 }
 phase(room,'results',now);
}
export function expire(room:Room,now:number,epoch:number,deadline:number) {
 if(room.epoch!==epoch || room.deadline!==deadline || now<deadline)return;
 if(room.phase==='writing')phase(room,'reveal',now);
 else if(room.phase==='voting')tally(room,now);
}
export function command(room:Room,token:string,cmd:Command,now:number):Room {
 // Catch up before accepting late answers, even if a scheduled job is delayed.
 if(room.deadline!==null)expire(room,now,room.epoch,room.deadline);
 const p=player(room,token);
 if(cmd.type==='join') {
  if(p)return room;
  if(room.phase!=='lobby')fail('This game has started. Rejoin on your original browser.');
  if(room.players.length>=8)fail('This room is full.');
  const name=cmd.name.trim();
  if(!name || name.length>24)fail('Use a name between 1 and 24 characters.');
  if(room.players.some(p=>p.name.toLowerCase()===name.toLowerCase()))fail('That name is already taken.');
  room.players.push({id:`p${room.epoch++}`,token,name,score:0,ready:false});return room;
 }
 if(cmd.type==='ready') { if(!p || room.phase!=='lobby')fail('Join the lobby first.');p.ready=cmd.ready;return room; }
 if(cmd.type==='answer') {
  if(!p || room.phase!=='writing' || room.remaining!==null)fail('Writing is closed or paused.');
  const m=room.matches[cmd.match];
  if(!m || !m.authors.includes(p.id))fail('This prompt is not yours.');
  if(m.answers[p.id]!==undefined)fail('Answer already submitted.');
  const answer=cmd.text.trim();if(!answer || answer.length>200)fail('Use 1–200 characters.');
  m.answers[p.id]=answer;
  if(room.matches.every(m=>m.authors.every(a=>m.answers[a]!==undefined)))phase(room,'reveal',now);
  return room;
 }
 if(cmd.type==='vote') {
  if(!p || room.phase!=='voting' || room.remaining!==null)fail('Voting is closed or paused.');
  const m=room.matches[room.matchIndex];
  if(m.authors.includes(p.id))fail('Sit this vote out: one answer is yours.');
  if(m.votes[p.id]!==undefined)fail('You have already voted.');
  if(!m.authors.includes(cmd.choice) || !m.answers[cmd.choice])fail('Choose an available answer.');
  m.votes[p.id]=cmd.choice;
  if(room.players.filter(p=>!m.authors.includes(p.id)).every(p=>m.votes[p.id]!==undefined))tally(room,now);
  return room;
 }
 host(room,token);
 switch(cmd.type) {
  case 'settings':
   if(room.phase!=='lobby')fail('Change settings in the lobby.');
   if(![60,120,180,300].includes(cmd.seconds)||![1,2,3].includes(cmd.rounds))fail('Invalid settings.');
   room.seconds=cmd.seconds;room.rounds=cmd.rounds;break;
  case 'remove':
   if(room.phase!=='lobby')fail('Remove players between games.');
   room.players=room.players.filter(p=>p.id!==cmd.playerId);break;
  case 'start':
   if(room.phase!=='lobby'||room.players.length<3||!room.players.every(p=>p.ready))fail('You need 3–8 ready players.');
   room.players.forEach(p=>p.score=0);room.round=0;beginRound(room,now);break;
  case 'next':
   if(room.phase==='reveal') {
    const m=room.matches[room.matchIndex];
    if(m.authors.some(a=>!m.answers[a]))phase(room,'results',now);
    else phase(room,'voting',now,30);
   }else if(room.phase==='results') {
    if(++room.matchIndex<room.matches.length)phase(room,'reveal',now);
    else if(room.round<room.rounds)beginRound(room,now);
    else phase(room,'finished',now);
   }else fail('There is nothing to advance yet.');break;
  case 'pause':
   if(room.deadline===null)fail('No active timer.');
   room.remaining=Math.max(1,room.deadline-now);room.deadline=null;break;
  case 'resume':
   if(room.remaining===null)fail('Game is not paused.');
   room.deadline=now+room.remaining;room.remaining=null;break;
  case 'extend':
   if(room.remaining!==null)room.remaining+=30000;
   else if(room.deadline!==null)room.deadline+=30000;
   else fail('No active timer.');break;
  case 'lobby':
   if(!['finished','lobby'].includes(room.phase))fail('Finish this game first.');
   room.matches=[];room.round=0;room.players.forEach(p=>p.ready=false);phase(room,'lobby',now);break;
 }
 return room;
}
export function project(room:Room,token:string) {
 const me=player(room,token), isHost=token===room.hostToken;
 if(!me&&!isHost)fail('Rejoin this room to continue.');
 const showing=['reveal','voting','results'].includes(room.phase);
 const m=room.matches[room.matchIndex];
 return {
  code:room.code,phase:room.phase,round:room.round,rounds:room.rounds,seconds:room.seconds,
  epoch:room.epoch,deadline:room.deadline,remaining:room.remaining,isHost,me:me?.id??null,
  players:room.players.map(({id,name,score,ready})=>({id,name,score,ready})),
  submitted:room.matches.reduce((n,m)=>n+Object.keys(m.answers).length,0),total:room.matches.length*2,
  tasks:me&&room.phase==='writing'?room.matches.flatMap((m,i)=>m.authors.includes(me.id)?[{index:i,prompt:m.prompt,answer:m.answers[me.id]??null}]:[]):[],
  matchup:showing?{index:room.matchIndex,total:room.matches.length,prompt:m.prompt,
   // Opaque A/B identifiers: do not leak author IDs until results.
   answers:m.authors.map((a,i)=>({choice:String(i),text:m.answers[a]??null,...(room.phase==='results'?{author:room.players.find(p=>p.id===a)!.name,votes:Object.values(m.votes).filter(v=>v===a).length}:{})})),
   canVote:!!me&&!m.authors.includes(me.id),voted:!!me&&m.votes[me.id]!==undefined,
   voteCount:Object.keys(m.votes).length,eligible:room.players.length-2}:null,
 };
}
export type View=ReturnType<typeof project>;
