import {createRequire} from 'node:module';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {ConvexHttpClient} from 'convex/browser';
import {api} from '../src/api.js';
import {elevenVoice} from '../server/voice-provider.js';
import {hostBanter,writingCue,roundQuip} from '../src/banter.js';
const require=createRequire(import.meta.url);
const synth=require('mespeak');
synth.loadConfig(require('mespeak/src/mespeak_config.json'));
synth.loadVoice(require('mespeak/voices/en/en-us.json'));

export default async function voice(req:IncomingMessage&{body?:unknown},res:ServerResponse){
 res.setHeader('Cache-Control','private, no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');res.statusCode=405;res.end();return;}
 const body=req.body as {code?:string;token?:string;epoch?:number;cue?:'main'|'mid'|'late'}|undefined;
 if(!body||typeof body.code!=='string'||typeof body.token!=='string'||!Number.isSafeInteger(body.epoch)){
  res.statusCode=400;res.end('Invalid request');return;
 }
 try{
  const url=process.env.VITE_CONVEX_URL;
  if(!url)throw new Error('Voice backend is not configured');
  // Resolve text from the authenticated host view; never accept arbitrary synthesis text.
  const room=await new ConvexHttpClient(url).query(api.view,{code:body.code,token:body.token});
  if(!room?.isHost){res.statusCode=403;res.end('Host access required');return;}
  if(room.epoch!==body.epoch||room.remaining!==null){res.statusCode=409;res.end('Game moved on');return;}
  const cue=body.cue??'main';
  if(!['main','mid','late'].includes(cue)){res.statusCode=400;res.end();return;}
  if(cue!=='main'&&(room.phase!=='writing'||writingCue(room,Date.now())!==cue||room.deadline===null||room.deadline-Date.now()<10000)){res.statusCode=204;res.end();return;}
  const match=room.matchup;
  const text=cue!=='main'?roundQuip(room,cue):room.phase==='reveal'&&match?(room.revealStep===0?match.prompt:match.answers[room.revealStep-1]?.text??'No answer submitted.'):
   room.phase==='lobby'?'Host voice is ready. Let’s hear those terrible ideas!':hostBanter(room);
  if(!text){res.statusCode=204;res.end();return;}
  let audio=await elevenVoice(text,room.phase==='reveal'?(room.revealStep===0?'setup':'answer'):'banter').catch(()=>null);
  if(!audio){
   const wav:Buffer=synth.speak(text,{rawdata:'buffer',speed:160,pitch:46,amplitude:100});
   if(!wav||wav.length<44)throw new Error('Empty voice output');
   audio={data:wav,type:'audio/wav',provider:'fallback' as const};
  }
  res.setHeader('X-Voice-Provider',audio.provider);
  res.setHeader('Content-Type',audio.type);res.setHeader('Content-Length',audio.data.length);res.end(audio.data);
 }catch{res.statusCode=503;res.end('Host voice could not be generated. Please retry.');}
}
