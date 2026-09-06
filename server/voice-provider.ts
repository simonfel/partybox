import {createHash} from 'node:crypto';
export type VoiceAudio={data:Buffer;type:string;provider:'elevenlabs'|'fallback'};
const cache=new Map<string,{audio:VoiceAudio;expires:number}>();
const pending=new Map<string,Promise<VoiceAudio>>();

/** Private, bounded warm-instance cache. No audio or credentials are public. */
export async function elevenVoice(text:string):Promise<VoiceAudio|null>{
 const key=process.env.ELEVENLABS_API_KEY;
 if(!key)return null;
 const voice=process.env.ELEVENLABS_VOICE_ID||'JBFqnCBsd6RMkjVDRZzb';
 const model=process.env.ELEVENLABS_MODEL_ID||'eleven_flash_v2_5';
 const id=createHash('sha256').update(JSON.stringify([key,voice,model,text])).digest('hex');
 const hit=cache.get(id);if(hit&&hit.expires>Date.now())return hit.audio;
 if(pending.has(id))return pending.get(id)!;
 const task=(async()=>{
  const response=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`,{
   method:'POST',headers:{'xi-api-key':key,'Content-Type':'application/json',Accept:'audio/mpeg'},
   body:JSON.stringify({text,model_id:model,voice_settings:{stability:.4,similarity_boost:.75,use_speaker_boost:true}}),
   signal:AbortSignal.timeout(8000),
  });
  if(!response.ok)throw new Error(`Voice provider status ${response.status}`);
  if(!response.headers.get('Content-Type')?.startsWith('audio/'))throw new Error('Invalid voice response');
  const data=Buffer.from(await response.arrayBuffer());
  if(data.length<32||data.length>2_000_000)throw new Error('Invalid voice audio');
  const audio:VoiceAudio={data,type:'audio/mpeg',provider:'elevenlabs'};
  if(cache.size>=100)cache.delete(cache.keys().next().value!);
  cache.set(id,{audio,expires:Date.now()+60*60*1000});return audio;
 })();
 pending.set(id,task);
 try{return await task;}finally{pending.delete(id);}
}
