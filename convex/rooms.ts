import { queryGeneric, mutationGeneric, internalMutationGeneric, makeFunctionReference } from 'convex/server';
import type { DataModelFromSchemaDefinition, MutationBuilder, QueryBuilder } from 'convex/server';
import { v } from 'convex/values';
import schema from './schema';
import { command, create, expire, project, type Room } from '../src/engine';
type Model=DataModelFromSchemaDefinition<typeof schema>;
const query:QueryBuilder<Model,'public'>=queryGeneric;
const mutation:MutationBuilder<Model,'public'>=mutationGeneric;
const internalMutation:MutationBuilder<Model,'internal'>=internalMutationGeneric;
const timeoutRef=makeFunctionReference<'mutation'>('rooms:timeout');
const cleanupRef=makeFunctionReference<'mutation'>('rooms:cleanup');
function validToken(token:string) { if(!/^[a-f0-9]{64}$/.test(token))throw new Error('Invalid session.'); }
const commandValidator=v.union(
 v.object({type:v.literal('ready'),ready:v.boolean()}),
 v.object({type:v.literal('settings'),seconds:v.number(),rounds:v.number()}),
 v.object({type:v.literal('answer'),match:v.number(),text:v.string()}),
 v.object({type:v.literal('vote'),choice:v.string()}),
 v.object({type:v.literal('remove'),playerId:v.string()}),
 ...(['start','next','pause','resume','extend','lobby'] as const).map(type=>v.object({type:v.literal(type)}))
);
export const createRoom=mutation({args:{token:v.string()},handler:async(ctx,{token})=>{
 validToken(token);
 const existing=await ctx.db.query('rooms').withIndex('by_host',q=>q.eq('hostToken',token)).unique();
 if(existing&&existing.expiresAt>Date.now())return existing.code;
 const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let code='';
 for(let attempt=0;attempt<20;attempt++) {
  code=Array.from({length:5},()=>alphabet[Math.floor(Math.random()*alphabet.length)]).join('');
  if(!await ctx.db.query('rooms').withIndex('by_code',q=>q.eq('code',code)).unique())break;
  code='';
 }
 if(!code)throw new Error('Please try again.');
 const expiresAt=Date.now()+24*60*60*1000;
 const id=await ctx.db.insert('rooms',{code,hostToken:token,state:JSON.stringify(create(code,token)),expiresAt});
 await ctx.scheduler.runAt(expiresAt,cleanupRef,{id});return code;
}});
export const join=mutation({args:{code:v.string(),token:v.string(),name:v.string()},handler:async(ctx,args)=>{
 validToken(args.token);
 const doc=await ctx.db.query('rooms').withIndex('by_code',q=>q.eq('code',args.code.toUpperCase())).unique();
 if(!doc||doc.expiresAt<=Date.now())throw new Error('Room not found or expired.');
 const room=command(JSON.parse(doc.state),args.token,{type:'join',name:args.name},Date.now());
 await ctx.db.patch(doc._id,{state:JSON.stringify(room)});return doc.code;
}});
export const view=query({args:{code:v.string(),token:v.string()},handler:async(ctx,args)=>{
 validToken(args.token);
 const doc=await ctx.db.query('rooms').withIndex('by_code',q=>q.eq('code',args.code)).unique();
 if(!doc||doc.expiresAt<=Date.now())return null;
 return project(JSON.parse(doc.state),args.token);
}});
export const act=mutation({args:{code:v.string(),token:v.string(),epoch:v.number(),command:commandValidator},handler:async(ctx,args)=>{
 validToken(args.token);
 const doc=await ctx.db.query('rooms').withIndex('by_code',q=>q.eq('code',args.code)).unique();
 if(!doc||doc.expiresAt<=Date.now())throw new Error('Room expired.');
 const room:Room=JSON.parse(doc.state);
 if(room.epoch!==args.epoch)throw new Error('The game moved on. Please try again.');
 // Never accept stable player IDs from the public voting API.
 if(args.command.type==='vote') {
  if(!['0','1'].includes(args.command.choice))throw new Error('Invalid answer.');
  const match=room.matches[room.matchIndex];
  if(!match)throw new Error('No active matchup.');
  args.command.choice=match.authors[Number(args.command.choice)];
 }
 command(room,args.token,args.command,Date.now());
 await ctx.db.patch(doc._id,{state:JSON.stringify(room)});
 if(room.deadline!==null)await ctx.scheduler.runAt(room.deadline,timeoutRef,{id:doc._id,epoch:room.epoch,deadline:room.deadline});
}});
export const timeout=internalMutation({args:{id:v.id('rooms'),epoch:v.number(),deadline:v.number()},handler:async(ctx,args)=>{
 const doc=await ctx.db.get(args.id);if(!doc)return;
 const room:Room=JSON.parse(doc.state);expire(room,Date.now(),args.epoch,args.deadline);
 await ctx.db.patch(doc._id,{state:JSON.stringify(room)});
}});
export const cleanup=internalMutation({args:{id:v.id('rooms')},handler:async(ctx,{id})=>{
 const doc=await ctx.db.get(id);if(doc&&doc.expiresAt<=Date.now())await ctx.db.delete(id);
}});
