import {describe,it,expect} from 'vitest';
import {create,command,project,expire,type Room} from '../src/engine';
function ready(){const r=create('ABCDE','host');for(let i=0;i<3;i++){command(r,`t${i}`,{type:'join',name:`Player ${i}`},0);command(r,`t${i}`,{type:'ready',ready:true},0)}command(r,'host',{type:'settings',seconds:120,rounds:1},0);command(r,'host',{type:'start'},0);return r}
function answerAll(r:Room){r.matches.forEach((m,index)=>m.authors.forEach(id=>{command(r,r.players.find(p=>p.id===id)!.token,{type:'answer',match:index,text:`Secret ${index} ${id}`},1)}))}
function revealAll(r:Room){while(r.phase==='reveal'){const d=r.deadline!;expire(r,d,r.epoch,d);}}
describe('authoritative game rules',()=>{
 it('requires host credentials and ready players',()=>{const r=create('ABCDE','host');expect(()=>command(r,'ABCDE',{type:'start'},0)).toThrow();expect(()=>command(r,'host',{type:'start'},0)).toThrow()});
 it('rejoining keeps the same identity and score',()=>{const r=ready();const id=r.players[0].id;r.players[0].score=100;command(r,'t0',{type:'join',name:'Changed'},1);expect(r.players).toHaveLength(3);expect(r.players[0]).toMatchObject({id,score:100,name:'Player 0'})});
 it('gives each player two prompts and hides secrets from host and opponents',()=>{const r=ready();command(r,'t0',{type:'answer',match:0,text:'Never expose me'},1);expect(project(r,'t0').tasks).toHaveLength(2);expect(JSON.stringify(project(r,'host'))).not.toContain('Never expose me');expect(JSON.stringify(project(r,'t2'))).not.toContain('Never expose me');expect(JSON.stringify(project(r,'t0'))).not.toContain('hostToken');expect(()=>project(r,'stranger')).toThrow()});
 it('does not reveal later matchups or authors before voting',()=>{const r=ready();answerAll(r);const view=project(r,'host');expect(view.matchup?.answers[0]).not.toHaveProperty('author');expect(JSON.stringify(view)).not.toContain('Secret 1');expect(view.matchup?.answers[0].choice).toBe('0')});
 it('rejects self-votes, duplicate votes and stale phase actions',()=>{const r=ready();answerAll(r);revealAll(r);const m=r.matches[0];expect(()=>command(r,'t0',{type:'vote',choice:m.authors[0]},3)).toThrow();command(r,'t2',{type:'vote',choice:m.authors[0]},3);expect(r.players[0].score).toBe(100);expect(()=>command(r,'t2',{type:'vote',choice:m.authors[0]},4)).toThrow();expect(r.players[0].score).toBe(100)});
 it('pause and extend invalidate previously scheduled deadlines',()=>{const r=ready();const epoch=r.epoch;command(r,'host',{type:'pause'},1000);expire(r,120000,epoch,120000);expect(r.phase).toBe('writing');expect(()=>command(r,'t0',{type:'answer',match:0,text:'Paused'},120000)).toThrow();command(r,'host',{type:'extend'},120000);command(r,'host',{type:'resume'},120000);expect(r.deadline).toBe(269000);expire(r,130000,epoch,120000);expect(r.phase).toBe('writing');expire(r,269000,epoch,269000);expect(r.phase).toBe('reveal')});
 it('rejects answers after the deadline even before scheduled delivery',()=>{const r=ready();expect(()=>command(r,'t0',{type:'answer',match:0,text:'Too late'},120001)).toThrow();expect(r.matches[0].answers).toEqual({})});
 it('two missing answers award no points and cannot block progress',()=>{const r=ready();expire(r,120000,r.epoch,120000);for(let i=0;i<3;i++){revealAll(r);expect(r.phase).toBe('results');command(r,'host',{type:'next'},200000+i*100000)}expect(r.phase).toBe('roundResults');command(r,'host',{type:'next'},600000);expect(r.phase).toBe('finished');expect(r.players.every(p=>p.score===0)).toBe(true)});
 it('completes a round and returns the same players to the lobby',()=>{const r=ready();answerAll(r);for(let i=0;i<3;i++){revealAll(r);const m=r.matches[i];const voter=r.players.find(p=>!m.authors.includes(p.id))!;command(r,voter.token,{type:'vote',choice:m.authors[0]},3);command(r,'host',{type:'next'},4)}expect(r.phase).toBe('roundResults');command(r,'host',{type:'next'},5);expect(r.phase).toBe('finished');expect(r.players.reduce((n,p)=>n+p.score,0)).toBe(300);command(r,'host',{type:'lobby'},5);expect(r.phase).toBe('lobby');expect(r.players).toHaveLength(3);expect(r.players.every(p=>!p.ready)).toBe(true)});
});

describe('paced reveals, drafts and new scoring',()=>{
 it('reveals the prompt, A, then B before automatically opening voting',()=>{
  const r=ready();answerAll(r);
  expect(project(r,'t2').matchup?.answers.every(a=>!a.revealed&&a.text===null)).toBe(true);
  let d=r.deadline!;expire(r,d,r.epoch,d);
  const first=project(r,'t2');expect(first.matchup?.answers[0].text).toContain('Secret 0');expect(first.matchup?.answers[1].text).toBeNull();
  d=r.deadline!;expire(r,d,r.epoch,d);expect(project(r,'t2').matchup?.answers.every(a=>a.revealed)).toBe(true);
  d=r.deadline!;expire(r,d,r.epoch,d);expect(r.phase).toBe('voting');
 });
 it('locks the latest saved draft at timeout without leaking it, and ignores reordered saves',()=>{
  const r=ready();command(r,'t0',{type:'draft',match:0,text:'New draft',revision:2},2);
  command(r,'t0',{type:'draft',match:0,text:'Old draft',revision:1},3);
  expect(JSON.stringify(project(r,'host'))).not.toContain('New draft');
  expect(project(r,'t0').tasks[0].draft).toBe('New draft');
  expire(r,120000,r.epoch,120000);expect(r.matches[0].answers[r.players[0].id]).toBe('New draft');
  revealAll(r);expect(r.matches[0].result?.kind).toBe('walkover');expect(r.players[0].score).toBe(50);
 });
 it('never overwrites a locked answer with a pending draft',()=>{
  const r=ready();command(r,'t0',{type:'answer',match:0,text:'Locked'},1);command(r,'t0',{type:'draft',match:0,text:'Pending',revision:10},2);
  expire(r,120000,r.epoch,120000);expect(r.matches[0].answers[r.players[0].id]).toBe('Locked');
 });
 it('keeps a cleared draft empty at timeout',()=>{
  const r=ready();command(r,'t0',{type:'draft',match:0,text:'Something',revision:1},1);command(r,'t0',{type:'draft',match:0,text:'',revision:2},2);
  expire(r,120000,r.epoch,120000);expect(r.matches[0].answers).toEqual({});
 });
 it('awards a half-value walkover once, even when old jobs fire again',()=>{
  const r=ready();command(r,'t0',{type:'answer',match:0,text:'Only answer'},1);expire(r,120000,r.epoch,120000);
  while((r.revealStep??0)<2){const d=r.deadline!;expire(r,d,r.epoch,d);}
  const epoch=r.epoch,d=r.deadline!;expire(r,d,epoch,d);expire(r,d+10,epoch,d);
  expect(r.players[0].score).toBe(50);expect(r.matches[0].result?.kind).toBe('walkover');
 });
 it('a strict majority rejects both, including negative scores',()=>{
  const r=ready();answerAll(r);revealAll(r);command(r,'t2',{type:'vote',choice:'both'},r.deadline!-1);
  expect(r.matches[0].result?.kind).toBe('rejected');expect(r.players.map(p=>p.score)).toEqual([-100,-100,0]);
 });
 it('a split vote is a tie; half choosing both is not a majority',()=>{
  function four(){const r=create('ABCDE','host');for(let i=0;i<4;i++){command(r,`t${i}`,{type:'join',name:`P${i}`},0);command(r,`t${i}`,{type:'ready',ready:true},0);}command(r,'host',{type:'start'},0);answerAll(r);revealAll(r);return r;}
  const r=four(),m=r.matches[0];command(r,'t2',{type:'vote',choice:m.authors[0]},r.deadline!-2);command(r,'t3',{type:'vote',choice:m.authors[1]},r.deadline!-1);
  expect(m.result?.kind).toBe('tie');expect(r.players.slice(0,2).map(p=>p.score)).toEqual([100,100]);
  const q=four();command(q,'t2',{type:'vote',choice:'both'},q.deadline!-2);command(q,'t3',{type:'vote',choice:q.matches[0].authors[0]},q.deadline!-1);
  expect(q.matches[0].result?.kind).toBe('winner');expect(q.players[0].score).toBe(100);
 });
 it('pauses the reveal and ignores an old stage deadline',()=>{
  const r=ready();answerAll(r);const d=r.deadline!,epoch=r.epoch;command(r,'host',{type:'pause'},2);expire(r,d,epoch,d);expect(r.revealStep).toBe(0);
  command(r,'host',{type:'resume'},d);const resumed=r.deadline!;expire(r,resumed,r.epoch,resumed);expect(r.revealStep).toBe(1);
 });
});

it('assigns distinct persistent characters and supports rooms created before characters',()=>{
 const r=create('ABCDE','host');
 for(let i=0;i<8;i++)command(r,`t${i}`,{type:'join',name:`Player ${i}`},0);
 const characters=project(r,'host').players.map(p=>p.character);
 expect(new Set(characters).size).toBe(8);
 command(r,'t0',{type:'join',name:'Reconnected'},1);
 command(r,'host',{type:'remove',playerId:r.players[1].id},2);
 expect(project(r,'t0').players[0].character).toBe(characters[0]);
 delete r.players[0].character;
 const legacy=project(r,'t0').players[0].character;
 expect(Number.isInteger(legacy)).toBe(true);
 expect(project(JSON.parse(JSON.stringify(r)),'host').players[0].character).toBe(legacy);
});
