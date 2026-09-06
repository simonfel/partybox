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
