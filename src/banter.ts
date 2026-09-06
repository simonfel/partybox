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
const spicy={
 openings:[
  'Welcome to Spicy. Flirt with disaster. It has fewer red flags than your last date.',
  'Two prompts. Plenty of time to disappoint your imaginary publicist.',
  'Write like your ex is reading. Vote like their new partner is playing.',
  'Time for bad decisions with excellent punctuation.',
  'Bring the innuendo. Leave the unsolicited relationship advice in the group chat.',
  'Your dating history finally qualifies as research. Make it count.',
 ],
 intermissions:[
  'The scores are in. Unlike your situationship, these numbers mean something.',
  'Take a sip of water. Some of those answers were thirsty enough.',
  'That round had chemistry. Unfortunately, so does a clogged drain.',
  'A quick break to pretend none of those answers were autobiographical.',
  'Your reputations have left the chat. Your scores remain.',
  'Check the leaderboard. Then check why your partner laughed so hard at that one.',
 ],
 finales:[
  'You won bragging rights. Please do not add them to your dating profile.',
  'The game is over. The awkward follow-up conversations are just beginning.',
  'Thanks for playing. Your dignity is waiting outside with a rideshare.',
  'A toast to the winner, and a moment of silence for plausible deniability.',
 ],
};
const unhinged={
 openings:[
  'Unhinged mode. The standards have left the building and stolen the copper wiring.',
  'Two prompts. Make something spectacularly fucked up and, ideally, funny.',
  'Welcome back. Your imaginary lawyer has asked to be paid in advance.',
  'Write your worst. The void is listening, and it has terrible taste.',
  'Time for another round. Even the demons in the walls are taking notes.',
  'Bring the chaos. If it gets zero votes, that is still your problem.',
 ],
 intermissions:[
  'What the hell was that? Excellent. Here are the scores.',
  'Take a breath. Your guardian angels are currently updating their résumés.',
  'That round was a beautiful dumpster fire. Some of you brought your own gasoline.',
  'The points are real. Your chance of explaining that answer at work is not.',
  'A brief pause while the imaginary ethics committee jumps out a window.',
  'Congratulations. You made a room full of adults laugh at absolute bullshit.',
 ],
 finales:[
  'You glorious bastard. Enjoy your entirely worthless crown.',
  'The winner gets bragging rights. Everyone else gets plausible deniability.',
  'The game is over. Please leave this level of chaos inside the room.',
  'Thanks for playing. Even hell has asked us to keep it down.',
 ],
};
export function hostBanter(room:View):string {
 let seed=0;for(const c of room.code)seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;
 const tone=room.edginess==='unhinged'?unhinged:room.edginess==='spicy'?spicy:{openings,intermissions,finales};
 const pick=(lines:string[])=>lines[(seed+room.round-1)%lines.length];
 if(room.phase==='writing')return `Round ${room.round}. ${pick(tone.openings)}`;
 if(room.phase==='roundResults')return `That’s round ${room.round}. ${pick(tone.intermissions)}`;
 if(room.phase==='finished'){
  const best=Math.max(...room.players.map(p=>p.score));
  const leaders=room.players.filter(p=>p.score===best);
  const announcement=leaders.length===1?`${leaders[0].name} wins!`:"A tie at the top! You’ll have to share the imaginary trophy.";
  return `${announcement} ${pick(tone.finales)}`;
 }
 return '';
}
