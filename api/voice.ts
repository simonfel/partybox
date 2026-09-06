import {createRequire} from 'node:module';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {ConvexHttpClient} from 'convex/browser';
import {api} from '../src/api';
import {hostBanter} from '../src/banter';
const require=createRequire(import.meta.url);
const synth=require('mespeak');
synth.loadConfig(require('mespeak/src/mespeak_config.json'));
synth.loadVoice(require('mespeak/voices/en/en-us.json'));

export default async function voice(req:IncomingMessage&{body?:unknown},res:ServerResponse){
 res.setHeader('Cache-Control','private, no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');res.statusCode=405;res.end();return;}
 const body=req.body as {code?:string;token?:string;epoch?:number}|undefined;
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
  const match=room.matchup;
  const text=room.phase==='reveal'&&match?(room.revealStep===0?match.prompt:match.answers[room.revealStep-1]?.text??'No answer submitted.'):
   room.phase==='lobby'?'Host voice is ready. Let’s hear those terrible ideas!':hostBanter(room);
  if(!text){res.statusCode=204;res.end();return;}
  const wav:Buffer=synth.speak(text,{rawdata:'buffer',speed:160,pitch:46,amplitude:100});
  if(!wav||wav.length<44)throw new Error('Empty voice output');
  res.setHeader('Content-Type','audio/wav');res.setHeader('Content-Length',wav.length);res.end(wav);
 }catch{res.statusCode=503;res.end('Host voice could not be generated. Please retry.');}
}
