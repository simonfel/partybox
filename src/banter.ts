import type {View} from './engine';

const openings=[
 'Two prompts. One reputation. Try to leave with at least one of those intact.',
 'Phones out. Standards down. Let’s make something we can never put on a résumé.',
 'Write something funny. Failing that, write something with confidence.',
 'Welcome back to the part where staring at your phone counts as socializing.',
 'Your next terrible idea could be somebody else’s favorite. That’s concerning, but useful.',
 'The blank page believes in you. Personally, I’m waiting for more evidence.',
 'Time for more answers. Remember, spelling is optional. Being funny is strongly encouraged.',
 'There are no bad ideas. There are, however, ideas that get zero votes.',
];
const intermissions=[
 'The scores are in. Please direct all complaints to the friend who voted against you.',
 'Take a breath. Hydrate. Quietly reconsider who you invited.',
 'A beautiful round of comedy. Several group chats may never recover.',
 'Some of you found your voice. Others should check under the couch.',
 'Those points have no cash value, but the smugness is absolutely real.',
 'We’ve learned a lot about each other. None of it belongs on LinkedIn.',
 'A quick break while everyone pretends they weren’t trying that hard.',
 'Check the standings. Practice your gracious loser face. We’ll wait.',
];
const finales=[
 'Your prize is bragging rights. Shipping and handling are somehow still extra.',
 'What a night. So many words. So few that we can repeat at work.',
 'Thanks for playing. Please collect your phones and whatever remains of your dignity.',
 'The comedy is over. The arguments about the voting may continue indefinitely.',
];
export function hostBanter(room:View):string {
 let seed=0;for(const c of room.code)seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;
 const pick=(lines:string[])=>lines[(seed+room.round-1)%lines.length];
 if(room.phase==='writing')return `Round ${room.round}. ${pick(openings)}`;
 if(room.phase==='roundResults')return `That’s round ${room.round}. ${pick(intermissions)}`;
 if(room.phase==='finished'){
  const best=Math.max(...room.players.map(p=>p.score));
  const leaders=room.players.filter(p=>p.score===best);
  const announcement=leaders.length===1?`${leaders[0].name} wins!`:"A tie at the top! You’ll have to share the imaginary trophy.";
  return `${announcement} ${pick(finales)}`;
 }
 return '';
}
