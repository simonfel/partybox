// Original PCM audio assets. Regenerate at build time; no external service needed.
import {mkdirSync,writeFileSync} from 'node:fs';
const rate=16000;
const patterns={welcome:[[523,.12],[659,.12],[784,.25]],writing:[[392,.12],[523,.12],[659,.12],[784,.3]],reveal:[[392,.08],[587,.18]],voting:[[660,.12],[660,.12],[880,.22]],winner:[[523,.1],[659,.1],[784,.12],[1046,.35]],tie:[[523,.13],[659,.13],[523,.13],[659,.25]],rejected:[[294,.18],[277,.18],[220,.35]],round:[[392,.13],[494,.13],[587,.13],[784,.35]],finished:[[523,.12],[659,.12],[784,.12],[1046,.18],[784,.12],[1046,.4]]};
mkdirSync('public/sounds',{recursive:true});
for(const [name,notes] of Object.entries(patterns)){
 const samples=[];
 for(const [freq,duration] of notes){
  for(let i=0;i<Math.floor(duration*rate);i++){
   const t=i/rate,env=Math.min(1,t/.008)*Math.min(1,(duration-t)/.045);
   samples.push(Math.round((Math.sin(2*Math.PI*freq*t)+.22*Math.sin(4*Math.PI*freq*t))*.26*env*32767));
  }
  samples.push(...Array(Math.floor(.045*rate)).fill(0));
 }
 const data=Buffer.alloc(44+samples.length*2);
 data.write('RIFF',0);data.writeUInt32LE(data.length-8,4);data.write('WAVEfmt ',8);data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(1,22);data.writeUInt32LE(rate,24);data.writeUInt32LE(rate*2,28);data.writeUInt16LE(2,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(samples.length*2,40);
 samples.forEach((value,i)=>data.writeInt16LE(value,44+i*2));
 writeFileSync(`public/sounds/${name}.wav`,data);
}
// Three original seamless 16-beat lounge loops, plus a short clock tick.
function writeWave(name,values){
 const b=Buffer.alloc(44+values.length*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(values.length*2,40);values.forEach((v,i)=>b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*2));writeFileSync(`public/sounds/${name}.wav`,b);
}
for(const [tone,bpm,roots] of [['clean',96,[130.81,174.61,146.83,196]],['spicy',104,[110,146.83,130.81,164.81]],['unhinged',112,[110,103.83,130.81,123.47]]]){
 const beat=60/bpm,length=Math.round(16*beat*rate),out=new Float32Array(length);let seed=719;
 for(let i=0;i<length;i++){
  const t=i/rate,step=Math.floor(t/beat),phase=t%beat,root=roots[Math.floor(step/4)%4];
  const bass=Math.sin(2*Math.PI*root*.5*phase)*Math.exp(-phase*10)*.26;
  const kick=step%2===0?Math.sin(2*Math.PI*(52*phase+3*(1-Math.exp(-phase*28))))*Math.exp(-phase*24)*.2:0;
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const hat=((seed/4294967296)*2-1)*Math.exp(-(t%(beat/2))*130)*.04;
  const pluckTime=t%(beat/2),ratio=[1,1.25,1.5,2,1.5,1.25,1.125,1.5][Math.floor(t/(beat/2))%8];
  const pluck=Math.sin(2*Math.PI*root*2*ratio*pluckTime)*Math.exp(-pluckTime*15)*.11;
  const edge=Math.min(1,i/160,(length-1-i)/160);
  out[i]=(bass+kick+hat+pluck)*edge;
 }
 writeWave(`bed-${tone}`,out);
}
writeWave('tick',Float32Array.from({length:1600},(_,i)=>Math.sin(2*Math.PI*1200*i/rate)*Math.exp(-i/170)*.2));
