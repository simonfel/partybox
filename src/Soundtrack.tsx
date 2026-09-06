import {useEffect,useRef,useState} from 'react';
import type {View} from './engine';
const clips=Object.fromEntries(['welcome','writing','reveal','voting','winner','tie','rejected','round','finished'].map(name=>[name,`/sounds/${name}.wav`]));

/** One reusable media element keeps gesture-unlocked audio on the host. */
export function Soundtrack({room}:{room:View}) {
 const media=useRef<HTMLAudioElement|null>(null);
 const request=useRef(0);
 const [blocked,setBlocked]=useState(false);
 const [failed,setFailed]=useState(false);
 const cue:keyof typeof clips=room.phase==='results'?(room.matchup?.result?.kind==='tie'?'tie':room.matchup?.result?.kind==='rejected'?'rejected':'winner'):room.phase==='roundResults'?'round':room.phase==='finished'?'finished':room.phase==='writing'?'writing':room.phase==='reveal'?'reveal':room.phase==='voting'?'voting':'welcome';
 function play(key:keyof typeof clips){
  const audio=media.current??(media.current=new Audio());
  const id=++request.current;
  audio.pause();audio.src=clips[key];audio.volume=.35;
  void audio.play().then(()=>{if(id===request.current){setBlocked(false);setFailed(false);}}).catch(e=>{
   if(id===request.current&&e.name!=='AbortError'){setBlocked(true);setFailed(e.name!=='NotAllowedError');}
  });
 }
 useEffect(()=>{
  if(!room.isHost)return;
  if(room.remaining===null)play(cue);
  return()=>{request.current++;media.current?.pause();};
 },[room.isHost,room.phase,room.round,room.matchup?.index,room.revealStep,room.remaining,cue]);
 if(!room.isHost)return null;
 return <div className="sound-check"><button onClick={()=>play('welcome')}>{blocked?'Start game sound':'Test sound'}</button>{failed&&<span role="status">Audio failed to play. Tap to retry.</span>}</div>;
}
