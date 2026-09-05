import {useEffect,useRef,useState} from 'react';
import type {View} from './engine';

export function Narrator({room}:{room:View}) {
 const [enabled,setEnabled]=useState(false);
 const [supported]=useState(()=>typeof speechSynthesis!=='undefined');
 const match=room.matchup;
 const text=room.phase==='reveal'&&match?(room.revealStep===0?match.prompt:match.answers[room.revealStep-1]?.text??'No answer submitted.') : '';
 useEffect(()=>{
  if(!enabled||!supported||!room.isHost)return;
  speechSynthesis.cancel();
  if(text&&room.remaining===null){const line=new SpeechSynthesisUtterance(text);line.rate=1;line.lang='en-US';speechSynthesis.speak(line);}
  return()=>speechSynthesis.cancel();
 },[enabled,supported,room.isHost,text,room.remaining,room.epoch]);
 if(!room.isHost)return null;
 return <div className="narration"><button aria-pressed={enabled} disabled={!supported} onClick={()=>{
  if(!enabled){const line=new SpeechSynthesisUtterance('Mic check. Let’s hear those jokes.');speechSynthesis.speak(line);}else speechSynthesis.cancel();setEnabled(!enabled);
 }}>{enabled?'Voice-over on · Mute':'Enable voice-over'}</button><small>{supported?'Reads the prompt and each answer on the host device.':'Voice-over is unavailable in this browser.'}</small></div>;
}
function Count({value,from}:{value:number;from:number}) {
 const [display,setDisplay]=useState(from);const previous=useRef(from);
 useEffect(()=>{
  const from=previous.current;previous.current=value;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){setDisplay(value);return;}
  const start=performance.now();let id=0;
  function tick(now:number){const t=Math.min(1,(now-start)/850);setDisplay(Math.round(from+(value-from)*(1-(1-t)**3)));if(t<1)id=requestAnimationFrame(tick);}
  id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);
 },[value]);
 return <>{display}</>;
}
export function ResultBanner({room}:{room:View}) {
 const m=room.matchup,r=m?.result;if(!r)return null;
 const names=r.winners.map(id=>room.players.find(p=>p.id===id)?.name??'Player');
 const titles={winner:`${names[0]} wins!`,tie:'A glorious tie!',noVotes:'The room went quiet.',walkover:`${names[0]} wins by default!`,empty:'A double no-show.',rejected:'Both suck. The room has spoken.'};
 const sub={winner:'Give that terrible answer a round of applause.',tie:'Equal votes. Shared bragging rights.',noVotes:'No answer votes. No points this matchup.',walkover:'One answer missing: 50% of the maximum matchup points.',empty:'No answers. No points.',rejected:'A majority of eligible voters rejected both. −100 points each.'};
 return <div className={`result-banner result-${r.kind}`} role="status"><span className="result-symbol" aria-hidden="true">{r.kind==='tie'?'⚖':r.kind==='rejected'?'✕':'✳'}</span><h2>{titles[r.kind]}</h2><p>{sub[r.kind]}</p></div>;
}
export function Scoreboard({room}:{room:View}) {
 const players=[...room.players].sort((a,b)=>b.score-a.score);
 const summary=['roundResults','finished'].includes(room.phase);
 const leaders=players.filter(p=>p.score===players[0]?.score);
 return <section className={`scoreboard panel ${summary?'round-summary':''}`}>
  <span className="eyebrow">{room.phase==='finished'?'FINAL RESULTS':`ROUND ${room.round} ${summary?'COMPLETE':'STANDINGS'}`}</span>
  <h2>{summary?(leaders.length>1?'Sharing the spotlight.':`${leaders[0]?.name} takes the lead!`):'The standings'}</h2>
  {summary&&<p>{room.phase==='finished'?'Thanks for the questionable comedy.':'The points are in. Take a moment to celebrate.'}</p>}
  <ol className="rankings">{players.map((p,i)=>{
   const rank=players.findIndex(x=>x.score===p.score)+1;
   return <li className={rank===1&&summary?'leader':''} key={p.id} style={{animationDelay:`${i*100}ms`}}><span className="rank">{rank===1&&summary?'✳':rank}</span><b>{p.name}</b>{summary&&<span className={`round-points ${p.roundPoints<0?'negative':''}`}>{p.roundPoints>=0?'+':''}{p.roundPoints} this round</span>}<strong><Count value={p.score} from={p.score-(summary?p.roundPoints:room.matchup?.result?.points[p.id]??0)}/></strong></li>;
  })}</ol>
 </section>;
}
