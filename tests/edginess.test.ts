import {expect,it} from 'vitest';
import {create,command,drawPrompts,project} from '../src/engine';
import {promptPools,type Edginess} from '../src/prompts';
import {hostBanter} from '../src/banter';

it('has 400 distinct authored prompts and exhausts each tone before recycling',()=>{
 const all=Object.values(promptPools).flat();
 expect(all).toHaveLength(400);expect(new Set(all).size).toBe(all.length);
 for(const edginess of Object.keys(promptPools) as Edginess[]){
  let room=create('ABCDE','host');room.edginess=edginess;
  const deck=promptPools[edginess];expect(deck.length).toBeGreaterThanOrEqual(100);
  const seen=new Set<string>();
  for(let n=0;n<deck.length;n+=4){
   for(const p of drawPrompts(room,4)){expect(deck).toContain(p);expect(seen.has(p)).toBe(false);seen.add(p)}
   room=JSON.parse(JSON.stringify(room));
  }
  expect(seen.size).toBe(deck.length);expect(new Set(drawPrompts(room,8)).size).toBe(8);
 }
});
it('retains other decks history when one deck recycles and modes change',()=>{
 const r=create('ABCDE','host');const clean=drawPrompts(r,8);
 r.edginess='spicy';const spicy=drawPrompts(r,100);drawPrompts(r,8);
 expect(r.usedPrompts).toEqual(expect.arrayContaining(clean));
 r.edginess='clean';expect(drawPrompts(r,8).some(p=>clean.includes(p))).toBe(false);
 r.edginess='unhinged';drawPrompts(r,100);drawPrompts(r,8);
 r.edginess='spicy';expect(drawPrompts(r,8).every(p=>spicy.includes(p))).toBe(true);
});
it('only allows host tone changes in the lobby; older clients preserve the selected tone',()=>{
 const r=create('ABCDE','host');command(r,'guest',{type:'join',name:'Guest'},0);
 expect(project(r,'host').edginess).toBe('clean');
 expect(()=>command(r,'guest',{type:'settings',seconds:120,rounds:3,edginess:'unhinged'},0)).toThrow('Only the host');
 expect(()=>command(r,'host',{type:'settings',seconds:120,rounds:3,edginess:'invalid' as Edginess},0)).toThrow('Invalid edginess');
 command(r,'host',{type:'settings',seconds:120,rounds:3,edginess:'spicy'},0);
 command(r,'host',{type:'settings',seconds:180,rounds:2},0);
 expect(project(r,'guest').edginess).toBe('spicy');
 r.phase='writing';expect(()=>command(r,'host',{type:'settings',seconds:120,rounds:3,edginess:'clean'},0)).toThrow('lobby');
 command(r,'host',{type:'lobby'},0);expect(r.edginess).toBe('spicy');
 expect(project(JSON.parse(JSON.stringify(r)),'host').edginess).toBe('spicy');
});
it('selects different host scripts for all three tones at each narrated phase',()=>{
 for(const phase of ['writing','roundResults','finished'] as const){
  const lines=new Set<string>();
  for(const edginess of Object.keys(promptPools) as Edginess[]){
   const r=create('ABCDE','host');r.phase=phase;r.round=1;r.edginess=edginess;
   command(r,'host',{type:'lobby'},0);r.phase=phase;r.round=1;
   lines.add(hostBanter(project(r,'host')));
  }
  expect(lines.size).toBe(3);
 }
});
