/** Original vector party creatures: eight silhouettes, eight palettes, four accessories. */
const colors=['#b5df62','#f39cb7','#a995eb','#78c9d3','#ffbc69','#86b8f3','#e7d461','#ce9dcc'];
const bodies=[
 'M26 72 Q17 45 34 31 Q51 16 69 32 Q86 45 76 72 Q52 85 26 72Z',
 'M24 72 L28 38 Q29 25 42 30 L51 42 L61 28 Q76 22 77 40 L80 72 Q53 85 24 72Z',
 'M23 71 Q19 48 35 46 Q30 23 48 23 Q66 19 66 43 Q84 46 80 70 Q56 85 23 71Z',
 'M24 71 L24 40 Q24 27 38 27 L66 27 Q79 27 79 40 L79 71 Q53 83 24 71Z',
 'M21 69 Q27 43 44 30 Q51 22 60 31 Q75 43 82 69 Q54 88 21 69Z',
 'M24 72 Q14 50 31 35 Q52 16 73 35 Q88 48 79 72 L67 68 L57 78 L46 69 L35 78Z',
 'M25 73 Q18 43 30 38 L26 20 L42 35 Q52 30 62 35 L77 20 L73 39 Q84 51 76 73 Q53 84 25 73Z',
 'M25 72 Q20 59 28 46 Q17 31 33 28 Q43 26 47 35 Q54 30 62 35 Q69 22 79 32 Q87 42 74 48 Q85 59 77 72 Q52 86 25 72Z',
];
export function Character({seed=0,celebrate=false}:{seed?:number;celebrate?:boolean}) {
 const n=Math.abs(Math.floor(seed))%256,shape=n%8,color=colors[Math.floor(n/8)%8],hat=Math.floor(n/64);
 return <svg className={`character ${celebrate?'character-celebrate':''}`} viewBox="0 0 104 104" aria-hidden="true" focusable="false">
  <ellipse cx="52" cy="93" rx="28" ry="5" fill="#211b35" opacity=".1"/>
  <g className="character-body" stroke="#211b35" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
   <path d="M39 76 L35 88 L27 88 M64 76 L69 88 L77 88" fill="none"/>
   <path d={celebrate?'M25 58 L13 43 L17 35 M78 58 L92 42 L88 34':'M25 56 L14 65 L18 70 M78 56 L91 63 L86 70'} fill="none"/>
   <path d={bodies[shape]} fill={color}/>
   <ellipse cx="41" cy="51" rx="7" ry="9" fill="#fffdf8" strokeWidth="2"/><ellipse cx="62" cy="51" rx="7" ry="9" fill="#fffdf8" strokeWidth="2"/>
   <circle cx="43" cy="52" r="3" fill="#211b35" stroke="none"/><circle cx="60" cy="52" r="3" fill="#211b35" stroke="none"/>
   <path d={celebrate?'M44 64 Q52 80 61 64Z':'M46 65 Q52 71 58 65'} fill={celebrate?'#fffdf8':'none'}/>
   <path d="M31 63 L36 64 M68 64 L73 63" stroke="#d85c83" strokeWidth="4"/>
   {hat===1&&<><path d="M38 29 L49 8 L62 29Z" fill="#f6b5c9"/><circle cx="49" cy="8" r="3" fill="#fffdf8"/></>}
   {hat===2&&<><path d="M52 28 L53 17"/><path d="M53 17 Q38 5 37 16 Q44 24 53 17 Q68 2 70 15 Q65 24 53 17Z" fill="#b5df62"/></>}
   {hat===3&&<><path d="M35 29 L69 29 M42 29 L42 16 L61 16 L61 29" fill="#211b35"/><path d="M44 24 L59 24" stroke="#f6b5c9"/></>}
  </g>
 </svg>;
}
