import {it,expect,vi} from 'vitest';
import {create,command,expire,project,shuffled,type Room} from '../src/engine';
import {writingCue,roundQuip} from '../src/banter';
import {promptPools} from '../src/prompts';
function ready(){const r=create('PACE','host');for(let i=0;i<8;i++){command(r,`t${i}`,{type:'join',name:`P${i}`},0);command(r,`t${i}`,{type:'ready',ready:true},0)}command(r,'host',{type:'start'},0);return r;}
function results(r:Room){expire(r,r.deadline!,r.epoch,r.deadline!);while(r.phase==='reveal')expire(r,r.deadline!,r.epoch,r.deadline!);}
it('shuffles opponents and faceoff order while assigning exactly two different opponents per player',()=>{
 let seed=13;const spy=vi.spyOn(Math,'random').mockImplementation(()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32));
 try{
 const r=ready(),first=JSON.stringify(r.matches.map(m=>m.authors));
 for(const p of r.players){const matches=r.matches.filter(m=>m.authors.includes(p.id));expect(matches).toHaveLength(2);expect(new Set(matches.flatMap(m=>m.authors).filter(id=>id!==p.id)).size).toBe(2)}
 expect(r.matches.flatMap(m=>m.authors)).not.toEqual(r.players.flatMap((p,i)=>[p.id,r.players[(i+1)%8].id]));
 command(r,'host',{type:'lobby'},1);for(const p of r.players)command(r,p.token,{type:'ready',ready:true},1);command(r,'host',{type:'start'},1);
 expect(JSON.stringify(r.matches.map(m=>m.authors))).not.toBe(first);
 expect(shuffled([1,2,3,4]).sort()).toEqual([1,2,3,4]);
 }finally{spy.mockRestore()}
});
it('automatically advances after two seconds, pauses safely and stops at the round summary',()=>{
 const r=ready();results(r);const deadline=r.deadline!,epoch=r.epoch;
 expire(r,deadline-1,epoch,deadline);expect(r.matchIndex).toBe(0);
 command(r,'host',{type:'pause'},deadline-1000);expire(r,deadline,epoch,deadline);expect(r.matchIndex).toBe(0);
 command(r,'host',{type:'resume'},deadline);const resumed=r.deadline!;expire(r,resumed,epoch,resumed);expect(r.matchIndex).toBe(1);
 expire(r,resumed,epoch,resumed);expect(r.matchIndex).toBe(1);
 while(r.phase!=='roundResults'){const d=r.deadline!;expect(d).not.toBeNull();expire(r,d,r.epoch,d)}
 expect(r.deadline).toBeNull();expect(r.players.every(p=>p.score===0)).toBe(true);
});
it('uses measured audio plus a comedy beat and accepts timing only once per host reveal stage',()=>{
 const r=ready();expire(r,r.deadline!,r.epoch,r.deadline!);const now=r.deadline!-1000,oldDeadline=r.deadline!,epoch=r.epoch;
 expect(()=>command(r,'t0',{type:'narration',duration:4},now)).toThrow('Only the host');
 expect(()=>command(r,'host',{type:'narration',duration:Infinity},now)).toThrow();
 command(r,'host',{type:'narration',duration:4},now);expect(r.deadline).toBe(now+5200);
 command(r,'host',{type:'narration',duration:40},now+1);expect(r.deadline).toBe(now+5200);
 expire(r,oldDeadline,epoch,oldDeadline);expect(r.revealStep).toBe(0);
 expire(r,r.deadline!,epoch,r.deadline!);expect(r.revealStep).toBe(1);
});
it('uses sparse tone-aware mid-round quips and sensible deadline windows',()=>{
 const r=ready();const v=project(r,'host');
 expect(writingCue(v,0)).toBe('main');expect(writingCue(v,60000)).toBe('mid');expect(writingCue(v,95000)).toBe('late');
 expect(roundQuip(v,'mid')).not.toBe(roundQuip(v,'late'));
 expect(new Set(['clean','spicy','unhinged'].map(edginess=>roundQuip({...v,edginess:edginess as typeof v.edginess},'mid'))).size).toBe(3);
});
it('keeps a large, unique, short, readable authored catalog',()=>{
 const all=Object.values(promptPools).flat();expect(all).toHaveLength(400);expect(new Set(all).size).toBe(400);
 for(const p of all){expect(p.length).toBeLessThan(180);expect(p.trim()).toBe(p);expect(p.split(/\s+/).length).toBeGreaterThan(4)}
 expect(all.filter(p=>p.includes('____')).length).toBeGreaterThan(10);
});
