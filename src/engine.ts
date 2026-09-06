/** Pure authoritative rules. Clients receive project(), never Room. */
export type Phase = 'lobby' | 'writing' | 'reveal' | 'voting' | 'results' | 'roundResults' | 'finished';
export type Player = { id: string; token: string; name: string; score: number; ready: boolean; character?:number };
export type Result = {kind:'winner'|'tie'|'noVotes'|'walkover'|'empty'|'rejected'; points:Record<string,number>; winners:string[]; rejected:number};
export type Match = { prompt: string; authors: [string, string]; answers: Record<string,string>; votes: Record<string,string>; drafts?:Record<string,{text:string;revision:number}>; result?:Result };
export type Room = { code: string; hostToken: string; players: Player[]; phase: Phase; round: number; matchIndex: number; matches: Match[]; epoch: number; deadline: number | null; remaining: number | null; seconds: number; rounds: number; revealStep?:number; roundStartScores?:Record<string,number>; usedPrompts?:string[]; edginess?:Edginess; narrationEpoch?:number };
import {promptPools,type Edginess} from './prompts';
export {prompts} from './prompts';
function fail(message: string): never { throw new Error(message); }
export function create(code: string, token: string): Room {
 return {code,hostToken:token,players:[],phase:'lobby',round:0,matchIndex:0,matches:[],epoch:0,deadline:null,remaining:null,seconds:120,rounds:3};
}
export function player(room:Room, token:string) { return room.players.find(p=>p.token===token); }
function host(room:Room,token:string) { if(token!==room.hostToken) fail('Only the host can do that.'); }
function phase(room:Room,next:Phase,now:number,seconds?:number) { room.phase=next;room.epoch++;room.deadline=seconds ? now+seconds*1000:null;room.remaining=null; }
/** History stays private and survives returning to the lobby and server reloads. */
export function drawPrompts(room:Room,count:number):string[] {
 const prompts=promptPools[room.edginess??'clean'];
 const used=new Set(room.usedPrompts??[]);
 // Include the current round when upgrading an existing room.
 room.matches.forEach(m=>used.add(m.prompt));
 const selected:string[]=[];
 let available=prompts.filter(p=>!used.has(p));
 while(selected.length<count){
  if(!available.length){
   prompts.forEach(p=>used.delete(p));
   // Finish the old deck before recycling; never duplicate within a round.
   available=prompts.filter(p=>!selected.includes(p));
  }
  const index=Math.floor(Math.random()*available.length);
  const [prompt]=available.splice(index,1);
  selected.push(prompt);used.add(prompt);
 }
 room.usedPrompts=[...used];
 return selected;
}
export function shuffled<T>(values:T[]):T[]{
 const out=[...values];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;
}
function beginRound(room:Room,now:number) {
 const roundPrompts=drawPrompts(room,room.players.length);
 room.round++;room.matchIndex=0;room.roundStartScores=Object.fromEntries(room.players.map(p=>[p.id,p.score]));
 const order=shuffled(room.players);
 room.matches=shuffled(order.map((p,i):Match=>({prompt:roundPrompts[i],authors:shuffled([p.id,order[(i+1)%order.length].id]) as [string,string],answers:{},votes:{}})));
 phase(room,'writing',now,room.seconds);
}
export type Command =
 | {type:'join'; name:string}
 | {type:'ready'; ready:boolean}
 | {type:'settings'; seconds:number; rounds:number; edginess?:Edginess}
 | {type:'narration'; duration:number}
 | {type:'start'} | {type:'next'} | {type:'pause'} | {type:'resume'} | {type:'extend'} | {type:'lobby'}
 | {type:'remove'; playerId:string}
 | {type:'answer'; match:number; text:string}
 | {type:'vote'; choice:string}
 | {type:'draft'; match:number; text:string; revision:number};
/** Reading time is authoritative so every screen reveals the same content. */
export function readingSeconds(text:string) { return Math.max(5, Math.min(24, Math.ceil(text.split(/\s+/).length / 2.2) + 2)); }
function beginReveal(room:Room,now:number) {
 room.revealStep=0;
 phase(room,'reveal',now,readingSeconds(room.matches[room.matchIndex].prompt)+18);
}
function tally(room:Room,now:number) {
 const m=room.matches[room.matchIndex];
 if(m.result)return;
 const eligible=room.players.length-2;
 const available=m.authors.filter(a=>!!m.answers[a]);
 const points:Record<string,number>=Object.fromEntries(m.authors.map(a=>[a,0]));
 const rejected=Object.values(m.votes).filter(v=>v==='both').length;
 let kind:Result['kind']='empty',winners:string[]=[];
 if(available.length===1){kind='walkover';winners=available;points[available[0]]=eligible*50;}
 else if(available.length===2){
  if(rejected>eligible/2){kind='rejected';m.authors.forEach(a=>points[a]=-100);}
  else {
   m.authors.forEach(a=>points[a]=Object.values(m.votes).filter(v=>v===a).length*100);
   const best=Math.max(...Object.values(points));
   winners=best>0?m.authors.filter(a=>points[a]===best):[];
   kind=best===0?'noVotes':winners.length===2?'tie':'winner';
  }
 }
 m.result={kind,points,winners,rejected};
 for(const p of room.players)p.score+=points[p.id]??0;
 phase(room,'results',now,2);
}
export function expire(room:Room,now:number,epoch:number,deadline:number) {
 if(room.epoch!==epoch || room.deadline!==deadline || now<deadline)return;
 if(room.phase==='writing'){
  for(const m of room.matches)for(const a of m.authors){
   const draft=m.drafts?.[a]?.text.trim();
   if(m.answers[a]===undefined&&draft)m.answers[a]=draft;
  }
  beginReveal(room,now);
 }else if(room.phase==='reveal'){
  const m=room.matches[room.matchIndex];
  const step=room.revealStep??0;
  if(step<2){room.revealStep=step+1;phase(room,'reveal',now,readingSeconds(m.answers[m.authors[step]]??'No answer submitted')+18);}
  else if(m.authors.some(a=>!m.answers[a]))tally(room,now);
  else phase(room,'voting',now,30);
 }else if(room.phase==='voting')tally(room,now);
 else if(room.phase==='results'){
  if(room.matchIndex+1<room.matches.length){room.matchIndex++;beginReveal(room,now);}
  else phase(room,'roundResults',now);
 }
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
  const used=new Set(room.players.map(p=>p.character??Number(p.id.slice(1))%256));
  const available=Array.from({length:256},(_,i)=>i).filter(i=>!used.has(i));
  const character=available[Math.floor(Math.random()*available.length)];
  room.players.push({character,id:`p${room.epoch++}`,token,name,score:0,ready:false});return room;
 }
 if(cmd.type==='ready') { if(!p || room.phase!=='lobby')fail('Join the lobby first.');p.ready=cmd.ready;return room; }
 if(cmd.type==='draft') {
  if(!p || room.phase!=='writing' || room.remaining!==null)fail('Writing is closed or paused.');
  const m=room.matches[cmd.match];
  if(!m || !m.authors.includes(p.id))fail('This prompt is not yours.');
  if(cmd.text.length>200 || !Number.isSafeInteger(cmd.revision) || cmd.revision<0)fail('Invalid draft.');
  if(m.answers[p.id]!==undefined)return room;
  m.drafts??={};
  if(cmd.revision>(m.drafts[p.id]?.revision??-1))m.drafts[p.id]={text:cmd.text,revision:cmd.revision};
  return room;
 }
 if(cmd.type==='answer') {
  if(!p || room.phase!=='writing' || room.remaining!==null)fail('Writing is closed or paused.');
  const m=room.matches[cmd.match];
  if(!m || !m.authors.includes(p.id))fail('This prompt is not yours.');
  if(m.answers[p.id]!==undefined)fail('Answer already submitted.');
  const answer=cmd.text.trim();if(!answer || answer.length>200)fail('Use 1–200 characters.');
  m.answers[p.id]=answer;
  if(room.matches.every(m=>m.authors.every(a=>m.answers[a]!==undefined)))beginReveal(room,now);
  return room;
 }
 if(cmd.type==='vote') {
  if(!p || room.phase!=='voting' || room.remaining!==null)fail('Voting is closed or paused.');
  const m=room.matches[room.matchIndex];
  if(m.authors.includes(p.id))fail('Sit this vote out: one answer is yours.');
  if(m.votes[p.id]!==undefined)fail('You have already voted.');
  if(cmd.choice!=='both'&&(!m.authors.includes(cmd.choice) || !m.answers[cmd.choice]))fail('Choose an available answer.');
  m.votes[p.id]=cmd.choice;
  if(room.players.filter(p=>!m.authors.includes(p.id)).every(p=>m.votes[p.id]!==undefined))tally(room,now);
  return room;
 }
 host(room,token);
 switch(cmd.type) {
  case 'narration':
   if(room.phase!=='reveal'||room.remaining!==null||!Number.isFinite(cmd.duration)||cmd.duration<0||cmd.duration>45)fail('Invalid narration timing.');
   if(room.narrationEpoch===room.epoch)break;
   room.narrationEpoch=room.epoch;room.deadline=now+Math.ceil((cmd.duration+1.2)*1000);break;
  case 'settings':
   if(room.phase!=='lobby')fail('Change settings in the lobby.');
   if(![60,120,180,300].includes(cmd.seconds)||![1,2,3].includes(cmd.rounds))fail('Invalid settings.');
   if(cmd.edginess!==undefined&&!Object.hasOwn(promptPools,cmd.edginess))fail('Invalid edginess.');
   room.seconds=cmd.seconds;room.rounds=cmd.rounds;room.edginess=cmd.edginess??room.edginess??'clean';break;
  case 'remove':
   if(room.phase!=='lobby')fail('Remove players between games.');
   room.players=room.players.filter(p=>p.id!==cmd.playerId);break;
  case 'start':
   if(room.phase!=='lobby'||room.players.length<3||!room.players.every(p=>p.ready))fail('You need 3–8 ready players.');
   room.players.forEach(p=>p.score=0);room.round=0;beginRound(room,now);break;
  case 'next':
   if(room.phase==='results') {
    if(room.matchIndex+1<room.matches.length){room.matchIndex++;beginReveal(room,now);}
    else phase(room,'roundResults',now);
   }else if(room.phase==='roundResults'){
    if(room.round<room.rounds)beginRound(room,now);else phase(room,'finished',now);
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
   room.usedPrompts=[...new Set([...(room.usedPrompts??[]),...room.matches.map(m=>m.prompt)])];room.matches=[];room.round=0;room.matchIndex=0;room.revealStep=0;room.roundStartScores={};room.players.forEach(p=>{p.ready=false;p.score=0;});phase(room,'lobby',now);break;
 }
 return room;
}
export function project(room:Room,token:string) {
 const me=player(room,token), isHost=token===room.hostToken;
 if(!me&&!isHost)fail('Rejoin this room to continue.');
 const showing=['reveal','voting','results'].includes(room.phase);
 const m=room.matches[room.matchIndex];
 return {
  edginess:room.edginess??'clean',canRestart:isHost,code:room.code,phase:room.phase,round:room.round,rounds:room.rounds,seconds:room.seconds,
  revealStep:room.revealStep??0,epoch:room.epoch,deadline:room.deadline,remaining:room.remaining,isHost,me:me?.id??null,
  players:room.players.map(({id,name,score,ready,character})=>({id,name,score,ready,character:character??Number(id.slice(1))%256,roundPoints:score-(room.roundStartScores?.[id]??score)})),
  submitted:room.matches.reduce((n,m)=>n+Object.keys(m.answers).length,0),total:room.matches.length*2,
  tasks:me&&room.phase==='writing'?room.matches.flatMap((m,i)=>m.authors.includes(me.id)?[{index:i,prompt:m.prompt,answer:m.answers[me.id]??null,draft:m.drafts?.[me.id]?.text??'',revision:m.drafts?.[me.id]?.revision??0}]:[]):[],
  matchup:showing?{index:room.matchIndex,total:room.matches.length,prompt:m.prompt,
   // Opaque A/B identifiers: do not leak author IDs until results.
   answers:m.authors.map((a,i)=>({choice:String(i),revealed:room.phase!=='reveal'||i<(room.revealStep??0),text:(room.phase!=='reveal'||i<(room.revealStep??0))?m.answers[a]??null:null,...(room.phase==='results'?{author:room.players.find(p=>p.id===a)!.name,votes:Object.values(m.votes).filter(v=>v===a).length}:{})})),
   canVote:!!me&&!m.authors.includes(me.id),voted:!!me&&m.votes[me.id]!==undefined,
   voteCount:Object.keys(m.votes).length,eligible:room.players.length-2,result:room.phase==='results'?m.result??null:null}:null,
 };
}
export type View=ReturnType<typeof project>;
