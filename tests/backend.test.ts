import {convexTest} from 'convex-test';
import {expect,it,vi} from 'vitest';
import schema from '../convex/schema';
import {api} from '../src/api';
// convex-test discovers the function root via an _generated path. Production
// functions use typed generic builders; this test-only marker avoids requiring
// a provisioned deployment just to discover that root. It mocks no functions.
const modules={...import.meta.glob('../convex/**/*.ts'),'../convex/_generated/test-root.ts':async()=>({})};
const host='a'.repeat(64),tokens=['b','c','d'].map(c=>c.repeat(64));
it('persists private state, resumes seats, rejects unauthorized actions and expires writing',async()=>{
 vi.useFakeTimers();
 try{
 const t=convexTest(schema,modules);
 const code=await t.mutation(api.create,{token:host});
 expect(await t.mutation(api.create,{token:host})).toBe(code);
 for(let i=0;i<3;i++)await t.mutation(api.join,{code,token:tokens[i],name:`Guest ${i}`});
 for(const token of tokens){const r=(await t.query(api.view,{code,token}))!;await t.mutation(api.act,{code,token,epoch:r.epoch,command:{type:'ready',ready:true}})}
 const r=(await t.query(api.view,{code,token:host}))!;
 await expect(t.mutation(api.act,{code,token:tokens[0],epoch:r.epoch,command:{type:'start'}})).rejects.toThrow('Only the host');
 await t.mutation(api.act,{code,token:host,epoch:r.epoch,command:{type:'settings',seconds:120,rounds:3,edginess:'unhinged'}});
 expect((await t.query(api.view,{code,token:tokens[0]}))?.edginess).toBe('unhinged');
 await t.mutation(api.act,{code,token:host,epoch:r.epoch,command:{type:'start'}});
 const writing=(await t.query(api.view,{code,token:tokens[0]}))!;
 await t.mutation(api.act,{code,token:tokens[0],epoch:writing.epoch,command:{type:'answer',match:writing.tasks[0].index,text:'PRIVATE ANSWER'}});
 expect(JSON.stringify(await t.query(api.view,{code,token:host}))).not.toContain('PRIVATE ANSWER');
 await t.mutation(api.join,{code,token:tokens[0],name:'Ignored'});
 expect((await t.query(api.view,{code,token:tokens[0]}))?.me).toBe(writing.me);
 await expect(t.query(api.view,{code,token:'f'.repeat(64)})).rejects.toThrow('Rejoin');
 await vi.advanceTimersByTimeAsync(120001);
 await t.finishInProgressScheduledFunctions();
 const reveal=(await t.query(api.view,{code,token:host}))!;
 expect(reveal.phase).toBe('reveal');
 for(let step=1;step<=2;step++){
  const state=(await t.query(api.view,{code,token:host}))!;
  await vi.advanceTimersByTimeAsync(state.deadline!-Date.now()+1);
  await t.finishInProgressScheduledFunctions();
  const advanced=(await t.query(api.view,{code,token:host}))!;
  expect(advanced.phase).toBe('reveal');expect(advanced.revealStep).toBe(step);
 }
 const last=(await t.query(api.view,{code,token:host}))!;
 await vi.advanceTimersByTimeAsync(last.deadline!-Date.now()+1);
 await t.finishInProgressScheduledFunctions();
 const result=(await t.query(api.view,{code,token:host}))!;
 expect(result.phase).toBe('results');expect(result.matchup?.result?.kind).toBe('walkover');
 expect(result.players.find(p=>p.id===writing.me)?.score).toBe(50);
 await expect(t.mutation(api.act,{code,token:host,epoch:writing.epoch,command:{type:'next'}})).rejects.toThrow('moved on');
 }finally{vi.useRealTimers()}
});
