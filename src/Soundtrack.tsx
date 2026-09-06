import {useEffect,useRef,useState} from 'react';
import type {View} from './engine';
const clips=Object.fromEntries(['welcome','writing','reveal','voting','winner','tie','rejected','round','finished'].map(name=>[name,`/sounds/${name}.wav`]));
export function Soundtrack({room}:{room:View}) {
 const media=useRef<HTMLAudioElement>(null),music=useRef<HTMLAudioElement>(null),tick=useRef<HTMLAudioElement>(null);
 const [blocked,setBlocked]=useState(false);const duck=useRef(false),lastTick=useRef('');
 const active=room.isHost&&room.remaining===null;
 const bed=active&&['writing','voting'].includes(room.phase);
 const cue=room.phase==='results'?(room.matchup?.result?.kind==='tie'?'tie':room.matchup?.result?.kind==='rejected'?'rejected':'winner'):room.phase==='roundResults'?'round':room.phase==='finished'?'finished':room.phase==='writing'?'writing':room.phase==='reveal'?'reveal':room.phase==='voting'?'voting':'welcome';
 function play(a:HTMLAudioElement|null){if(a)void a.play().then(()=>setBlocked(false)).catch(e=>{if(e.name!=='AbortError')setBlocked(true)});}
 useEffect(()=>{
  const voice=(e:Event)=>{duck.current=(e as CustomEvent<boolean>).detail;};
  window.addEventListener('partyroom-speaking',voice);
  const timer=setInterval(()=>{const a=music.current;if(a){const target=bed?(duck.current?.025:.14):0;a.volume+=(target-a.volume)*.25;if(!bed&&a.volume<.003)a.pause();}},80);
  return()=>{window.removeEventListener('partyroom-speaking',voice);clearInterval(timer);};
 },[bed]);
 useEffect(()=>{
  const a=music.current;if(!a)return;a.volume=0;
  if(bed)play(a);else a.pause();return()=>a.pause();
 },[bed,room.edginess]);
 useEffect(()=>{
  const a=media.current;if(!a)return;a.pause();a.src=clips[cue];a.volume=.24;
  // The opening sting happens once per matchup, not on each answer.
  if(active)play(a);return()=>a.pause();
 },[active,cue,room.round,room.matchup?.index]);
 useEffect(()=>{
  if(!active||!['writing','voting'].includes(room.phase)||room.deadline===null)return;
  const timer=setInterval(()=>{
   const left=Math.ceil((room.deadline!-Date.now())/1000),key=`${room.epoch}:${left}`;
   if(left>0&&left<=10&&lastTick.current!==key){lastTick.current=key;const a=tick.current;if(a){a.currentTime=0;a.volume=duck.current?.08:.3;play(a)}}
  },100);return()=>clearInterval(timer);
 },[active,room.phase,room.deadline,room.epoch]);
 if(!room.isHost)return null;
 return <div className="sound-check"><audio ref={media}/><audio ref={music} src={`/sounds/bed-${room.edginess??'clean'}.wav`} loop preload="auto"/><audio ref={tick} src="/sounds/tick.wav" preload="auto"/><button onClick={()=>{if(media.current){media.current.src=clips.welcome;play(media.current)}if(bed)play(music.current)}}>{blocked?'Start game sound':'Test sound'}</button></div>;
}
