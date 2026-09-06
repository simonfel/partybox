// Original Punchline prompts. Keep existing text stable: it identifies played prompts.
const original = [
 "Your dog has hired a lawyer. The first demand in the letter: ____.",
 "Complete the warning on a time machine sold at a garage sale: ____.",
 "The fridge has a new password. What did the cheese change it to?",
 "You can replace one Olympic event with a household chore. Name the event.",
 "A penguin walks into a job interview wearing a tie. Its opening line: ____.",
 "Write the push notification that finally makes someone throw away their smart toaster.",
 "The local library now has a VIP room. What happens in there?",
 "Invent a terrible new Scout badge that adults would actually earn.",
 "Finish the museum plaque: 'Experts still cannot explain why this spoon ____.'",
 "Name the low-budget sequel to 'The Very Hungry Caterpillar'.",
 "Your houseplants hold an intervention. What is their biggest complaint?",
 "A wizard gets one spell approved for office use. What does it do?",
 "Give a painfully honest name to the drawer everyone calls the junk drawer.",
 "The moon leaves Earth a one-star review. What does it say?",
 "A raccoon is running for mayor. Finish its campaign promise: 'A ____ in every bin.'",
 "Write the opening line of a pirate's extremely boring autobiography.",
 "Your pillow can send one text message a day. What does it keep saying?",
 "A hotel offers a cheaper version of a wake-up call. What is it?",
 "Invent the one feature that would make an umbrella genuinely worse.",
 "The fortune cookie says 'Congratulations!' followed by what terrible news?",
 'A terrible opening line for a museum audio guide.',
 'The secret ingredient in the world’s worst energy drink.',
 'Something you do not want your dentist to announce.',
 'The slogan for a vacation you will definitely regret.',];
export const cleanPrompts = [...original,
 "The first rule of a fight club for extremely polite people.",
 "A terrible thing to hear from your GPS during a first date.",
 "The name of a dating app exclusively for ghosts.",
 "What your dog would put in your annual performance review.",
 "A suspicious item on a babysitter’s invoice.",
 "The worst way to announce that you got promoted.",
 "The hidden downside of being able to talk to furniture.",
 "A restaurant special that sounds like a legal threat.",
 "The final stage of becoming your parents.",
 "A bad slogan for a company that rents out grandmas.",
 "The title of your autobiography, according to your browser history.",
 "An unusual thing to shout during a very quiet yoga class.",
 "The worst souvenir to bring home from a submarine tour.",
 "The real purpose of the tiny pocket in your jeans.",
 "A terrible reason to request a refund on a wedding cake.",
 "What a pigeon says before doing something incredibly brave.",
 "The most embarrassing thing for a wizard to pull out of a hat.",
 "The reason aliens immediately locked their spaceship doors.",
 "The worst place to install a revolving door.",
 "A sentence that ruins any romantic candlelit dinner.",
 "The name of a superhero whose only power is mild inconvenience.",
 "What the self-checkout machine is really judging you for.",
 "An unexpected category at the World’s Pettiest Awards.",
 "The catchphrase of a deeply unqualified detective.",
 "An honest slogan for airport sandwiches.",
 "The first thing a clone of you would complain about.",
 "The worst message to find inside a bottle washed ashore.",
 "A job that should absolutely not have a bring-your-kid day.",
 "The name of a luxury perfume that smells like Monday.",
 "A sign you hired the wrong exorcist.",
 "The most useless thing to pack for a deserted island.",
 "What a secret society of librarians is plotting.",
 "A terrible name for a cruise ship’s emergency exit.",
 "The actual reason dinosaurs went extinct.",
 "A deeply unimpressive world record you could break tonight.",
 "What your phone would say if it could file for divorce.",
 "A suspicious perk in a job listing for a castle guard.",
 "The opening sentence of the worst best-man speech.",
 "A warning you never want to hear at an all-you-can-eat buffet.",
 "The secret sixth love language.",
 "An event that would make competitive napping exciting.",
 "The least intimidating name for a motorcycle gang.",
 "A terrible business to open inside an elevator.",
 "What a snowman puts on a dating profile.",
 "A rejected flavor of toothpaste for adults.",
 "The first thing you’d outlaw as mayor of your couch.",
 "The real reason the Wi-Fi is slow at a haunted hotel.",
 "A very bad thing to add to a treasure map.",
 "The name of a support group for people who clap when planes land.",
 "What a robot would consider a midlife crisis.",
 "A terrible replacement for the school bell.",
 "The most passive-aggressive thing a smart speaker could say.",
 "The biggest scandal at a competitive knitting tournament.",
 "A new national holiday that everyone would actually celebrate.",
 "The least reassuring thing a pilot could say over the intercom.",
 "An extremely specific reason to get banned from a petting zoo.",
 "A slogan for a gym where nobody wants to exercise.",
 "The bonus feature on the world’s most expensive spoon.",
 "A line that definitely wasn’t in the original fairy tale.",
 "The first sign your therapist is actually three raccoons.",
 "What a volcano would complain about in an online review.",
 "A disappointing discovery at the end of a rainbow.",
 "The worst possible name for a password manager.",
 "A terrible phrase to embroider on a throw pillow.",
 "The real reason your missing socks never return.",
 "The title of a cooking show hosted by a fire alarm.",
 "A rule that would instantly improve meetings.",
 "The least useful thing a time traveler could warn you about.",
 "A secret menu item at a restaurant for villains.",
 "The slogan on a very disappointing magic carpet.",
 "The text you really don’t want from your house sitter.",
 "The only acceptable reason to wear a cape to a tax appointment.",
 "An unexpected item in a survival kit for family dinners.",
 "What a hamster thinks happens outside its cage.",
 "The most unnecessary thing to make Bluetooth-enabled.",
 "A very awkward name for a couples’ massage package.",
 "The reason a ghost got fired from a haunted house.",
 "A terrible thing to put on a lost-pet poster.",
 "The biggest problem with a bank run by pirates.",
 "A warning label for your group chat.",
 "An activity that becomes sinister when called a team-building exercise.",
 "What your fridge would list as your greatest achievement.",
 "The worst theme for a children’s birthday party magician.",
 "An unexpected qualification for becoming king.",
 "The name of a theme park for people who hate surprises.",
 "The first review of a hotel built inside a whale.",
 "A terrible line for a motivational fitness instructor.",
 "What a dragon hoards after getting bored of gold.",
 "The first sign your new roommate is a retired supervillain.",
 "An honest name for the drawer full of random cables.",
 "A question that should never appear on a job interview form.",
 "The most disappointing thing to inherit from a mysterious uncle.",
 "The title of a horror movie about assembling flat-pack furniture.",
 "The slogan for a dating service run by your mom.",
 "The secret ingredient in a potion of mild disappointment.",
 "A suspicious announcement at the neighborhood barbecue.",
 "The least impressive way to escape from prison in a movie.",
 "What an octopus would do with a smartwatch.",
 "An unsettling name for an airline’s loyalty program.",
 "The thing you should never say while cutting someone’s hair.",
 "The first rule at a finishing school for trolls.",
 "A terrible name for a meditation app.",
 "The sound your wallet would make if it could scream.",
 "A sport that definitely shouldn’t be played in an office.",
 "The reason a mermaid failed her driving test.",
 "A suspicious extra fee on a hotel bill.",
 "The most embarrassing thing to accidentally project onto a meeting screen.",
 "A slogan for a coffee shop that has completely given up.",
 "The worst possible update to a doorbell.",
 "A sentence that makes any recipe sound dangerous.",
 "What a gargoyle does on its day off.",
 "The most useless advice a fortune teller could give.",
 "A new museum exhibit nobody asked for.",
 "The name of a reality show about people sharing one charger.",
 "The worst thing to write in the comments section of a wedding RSVP.",
 "What a superhero calls in sick with.",
 "The real reason the moon only comes out at night.",
 "A terrible name for a high-end seafood restaurant.",
 "The warning your future self would leave on your bathroom mirror.",
 "A rejected feature of the next generation of humans.",
 "The first purchase of a raccoon who wins the lottery.",
 "A sentence you don’t want to hear in an escape room.",
 "The slogan for a terrible house-cleaning service.",
 "An unexpected thing to find in the office suggestion box.",
 "The one thing a vampire cannot resist at the grocery store.",
 "A new use for the extra buttons on a TV remote.",
 "The real meaning of “some assembly required.”",
 "A very questionable name for a daycare newsletter.",
 "The biggest problem with a restaurant that serves only soup.",
 "What the little man inside a traffic light does on red.",
 "An honest slogan for a storage unit company.",
 "A reason your evil twin wants to switch back.",
 "The award you’d win at a ceremony for ordinary household tasks.",
 "A terrible thing for a tour guide to say before turning off the lights.",
 "The name of a spa treatment invented by a plumber.",
 "The worst possible suggestion from an autocomplete keyboard.",
 "The secret handshake at a club for people with too many tabs open.",
 "An unexpected new feature of a shopping cart.",
 "The title of a romance novel set entirely in a hardware store.",
 "What an alien mistakes for Earth’s most sacred tradition.",
 "The most awkward thing a parrot could repeat at a dinner party.",
 "A bad reason to ring the emergency bell on a train.",
 "The name of a very budget-friendly space program.",
 "The fine print on a genie’s three-wishes contract.",
 "A terrible alternative to throwing rice at weddings.",
 "The most suspicious item at a church bake sale.",
 "A message you never want to see on a hotel TV.",
 "What a skeleton worries about before a first date.",
 "A terrible name for a neighborhood watch group.",
 "The real reason nobody reads the terms and conditions.",
 "An unexpected skill on a ninja’s résumé.",
 "The slogan for an app that makes your life slightly worse.",
 "A terrible icebreaker for a room full of strangers.",
 "What a very lazy villain threatens to do to the world.",
 "The worst excuse for missing your own surprise party.",
 "A rejected safety announcement for a roller coaster.",
 "The thing that finally made the tooth fairy unionize.",
 "A weird flex to put on a business card.",
 "The name of a shampoo marketed to werewolves.",
 "What a cat would charge you rent for.",
 "A terrifying sentence that begins with “Good news!”",
 "The reason a wizard got banned from a farmers’ market.",
 "The title of a documentary about the office microwave.",
 "An unexpected item on a very small bucket list.",
 "The motto of a secret club for terrible dancers.",
 "The worst time for a confetti cannon to go off.",
 "A suspicious instruction in a hotel’s welcome booklet.",
 "The name of an energy drink designed for people doing nothing.",
 "What a knight writes in a resignation letter.",
 "A horrible slogan for a meal-prep service.",
 "The strangest thing to discover your neighbor is collecting.",
 "The first thing a talking mirror would ask you to stop doing.",
 "A completely unnecessary upgrade to a bathrobe.",
 "The excuse a superhero gives for saving the wrong city.",
 "A disappointing answer to “What’s behind door number three?”",
 "The name of a podcast hosted by your two remaining brain cells.",
];

export type Edginess = 'clean' | 'spicy' | 'unhinged';
export const spicyPrompts = `
Your dating profile must include a warning label. Write yours.
Your ex opens a restaurant named after your relationship. What is it called?
Finish the breakup text: 'It is not you. It is your ____.'
A dating app adds a brutally honest filter. What does it filter out?
Write the least seductive sentence that still ends with 'in bed'.
Your walk of shame gets a corporate sponsor. Who sponsors it, and why?
A couples therapist sells one T-shirt. What does it say?
The hotel charges a $200 'romance fee'. What did you actually get?
Your worst date becomes a scented candle. Name the candle.
Write the message that makes someone delete a dating app halfway through reading it.
A bachelor party hires the wrong kind of stripper. Who arrives?
Your vibrator gets a performance review. What needs improvement?
Finish the wedding toast: 'I knew they were perfect together when ____.'
Your mother writes your dating bio. What is the first sentence?
Someone says 'I love a person in uniform.' Which uniform ruins the mood?
A bar names a drink after your last bad decision. What is in it?
Write a pickup line that only works on someone obsessed with spreadsheets.
Your situationship now offers a premium subscription. What is still missing?
Your phone must explain last night's texts to a jury. Give its opening statement.
Name a bedroom move that sounds more like a municipal construction project.
The name of a cocktail inspired by your worst decision.
An unhelpful slogan for a hangover cure.
The worst place to discover glitter after a night out.
The text that proves brunch is actually a recovery program.
What the bartender puts in the incident report about you.
The unofficial fourth stage of a bachelor party.
A nightclub rule that raises more questions than it answers.
The slogan for a wine marketed to people answering work emails.
A terrible excuse for crying in the club bathroom.
The most embarrassing item on a bar tab.
The real reason the office party has a two-drink limit.
A suspicious expense labeled business development.
The HR-approved translation of 'you absolute idiot'.
The worst thing to accidentally say while unmuted.
A resignation letter consisting of one devastating sentence.
The secret achievement unlocked by surviving your manager.
A LinkedIn endorsement nobody wants.
The real title of the person who does nothing in meetings.
What the office printer would report you to HR for.
A team-building exercise that ends in couples counseling.
An honest title for your boss's motivational podcast.
The phrase on a mug that gets you called into HR.
The worst slogan for a divorce lawyer's billboard.
The name of a subscription box for emotionally unavailable men.
A luxury service for people who refuse to apologize.
An app notification that feels personally judgmental.
The hidden fee on a friendship with an influencer.
A terrible launch announcement for a deodorant brand.
The slogan of a gym exclusively for people watching themselves.
A one-star review of your own personality.
The scandal that gets someone expelled from a book club.
A rumor that makes the neighborhood barbecue awkward.
The worst answer to 'so, how do you two know each other?'
The thing your relatives should stop bringing up at dinner.
An honest name for the family group chat.
The most petty reason to contest a will.
A wedding toast that becomes evidence in the divorce.
The worst thing to print on matching couples T-shirts.
A suspicious clause in a roommate agreement.
The award your upstairs neighbor deserves.
What your browser's incognito mode would put in a memoir.
The most embarrassing smart-speaker shopping suggestion.
A bad name for a discreet delivery service.
The last notification you want appearing on a shared screen.
A warning label for your camera roll.
The excuse for having seventeen tabs open about your ex.
The worst autocomplete after 'sorry about last night'.
What your smartwatch thinks your walk of shame is.
An embarrassing name for a private playlist.
The thing autocorrect absolutely should have stopped you sending.
The slogan for underwear designed by an accountant.
A terrible excuse for bringing handcuffs to a dinner party.
The least romantic place to install mood lighting.
An unexpected use for a hotel robe after checkout.
A ridiculous safe word for a very boring couple.
The most unappealing name for a massage oil.
An honest title for a romance novel about your love life.
A flirtatious message that could also be a plumbing estimate.
A terrible thing to call a bedroom renovation package.
The moment a strip poker game becomes a finance seminar.
A complaint from a ghost haunting a honeymoon suite.
A vampire's most embarrassing dating problem.
An awkward side effect of a love potion from the discount shelf.
The reason a werewolf is banned from speed dating.
What Cupid writes on his employee burnout form.
The name of a dating show for villains with trust issues.
A mermaid's most unreasonable relationship demand.
An adult toy that would confuse a medieval knight.
The first rule of a swingers club for introverts.
The least seductive thing a talking mirror could say.
The slogan for a spa that only treats emotional baggage.
A terrible name for a podcast hosted by two recently divorced dads.
An excuse that makes being caught snooping even worse.
The title of a masterclass on avoiding accountability.
A weird thing to brag about on a first date.
The most dramatic way to unfollow someone.
A loyalty reward for your fifth situationship.
What your bank calls your dating expenses.
An honest review of a party you only attended for the food.
The sentence that gets you removed from the wedding planning chat.
`.trim().split('\n');
export const unhingedPrompts = `
Your funeral has a sponsor. Finish the ad read: 'This loss was brought to you by ____.'
Hell has a suggestion box. What is the pettiest complaint in it?
A cult offers a free trial. What happens when you try to cancel?
Your sex robot has unionized. Its first demand: ____.
A porn parody gets funded by the government. What is the title?
The devil offers you eternal youth, but every Tuesday you must ____.
Write the warning label on a vibrator made by a defense contractor.
Your browser history is read aloud at your funeral. What does the priest say next?
A billionaire buys the afterlife. What is the first feature put behind a paywall?
Your guardian angel files a restraining order. What was the final straw?
A dominatrix offers a budget package. What is included for five dollars?
Complete the world's worst ransom note: 'We have your husband. Unfortunately, ____.'
A smart toilet sends your annual recap. What is your biggest achievement?
Name a sex position that sounds like a failed government program.
A necromancer runs a customer loyalty program. What happens on your tenth visit?
Write an apology so bad that the lawyer needs a lawyer.
A luxury coffin includes one app. What does the app do?
Your cult's accountant quits. What expense finally did it?
A demon possesses your group chat. What is the first thing it refuses to read?
The apocalypse gets delayed. Write the organizer's bullshit excuse.
The worst name for a sex robot's troubleshooting mode.
An embarrassing firmware update for a smart vibrator.
The least erotic sentence in an erotic cookbook.
The name of a porn parody of a tax preparation course.
A terrible slogan for a sex shop run by monks.
The most awkward thing for a dominatrix to invoice separately.
An adult film title about assembling office furniture.
The worst toy to accidentally leave connected to Bluetooth.
A complaint from a demon possessing a sex doll.
A safe word that takes far too long to say.
The name of a luxury butt plug designed by a tech CEO.
A terrible opening line at an orgy for accountants.
The instruction nobody reads on a bottle of cheap lube.
An honest slogan for a motel that rents by the apology.
The most inconvenient thing for a werewolf to transform during.
A horny wizard's worst spell-check mistake.
The worst name for a nudist resort's buffet.
An unexpected badge at a competitive kink convention.
The least sexy perk of immortality.
A porn site's surprisingly wholesome annual report headline.
The name of a cryptocurrency backed by pure bullshit.
An apology video that somehow announces a second scandal.
The worst perk in a dictator's employee benefits package.
A ridiculous expense on a corrupt mayor's receipt.
The rebrand a pyramid scheme thinks will fool everyone.
A terrible campaign promise from a sentient dumpster.
The worst excuse for laundering money through a pet spa.
The slogan for a hedge fund managed by drunk raccoons.
A billionaire's most insulting solution to the housing crisis.
The worst product to sell through a multi-level marketing cult.
A bribe that would only work on your group chat.
An honest slogan for a company monetizing your breakdown.
The headline after aliens buy Twitter's remaining furniture.
A bizarre tax deduction claimed by a supervillain.
The name of a bank that openly admits it lost your money.
A deeply unethical feature of a premium dating app.
The most tone-deaf sponsored post during the apocalypse.
The worst thing to hear from your lawyer on speakerphone.
A slogan for a startup replacing friends with invoices.
The official sport of late-stage capitalism.
What a restaurant calls food poisoning on its tasting menu.
The worst flavor of edible underwear.
A truly cursed prize in a cereal box for adults.
An apology from a toilet manufacturer that raises new concerns.
The slogan for a cologne called Municipal Sewage.
The most disturbing thing a smart toilet could congratulate you on.
The worst phrase to print on a bag of mystery meat.
A warning label for a gas-station sushi subscription.
The name of a cooking show hosted by a hungover necromancer.
An unnecessary innovation in public bathroom technology.
The secret menu at a restaurant with an ankle monitor.
The most disgusting thing to make artisanal.
The worst name for a probiotic aimed at aggressive men.
A sentence that ruins a chocolate fountain forever.
The last thing you want to hear from a tattoo artist at 3 a.m.
A terrible brand name for recycled toilet paper.
The name of a candle that smells like bad decisions and shrimp.
An alarming slogan for a discount colon cleanse.
The thing a raccoon would refuse to eat on principle.
A Michelin inspector's final sentence before quitting.
The reason your emotional support demon got expelled.
A terrible motivational quote for an escape room hostage actor.
The worst thing to accidentally summon with a Ouija board.
The side hustle that gets a clown banned from children's parties.
A customer complaint about a rent-a-cult service.
The least intimidating threat from a mafia boss in therapy.
What the apocalypse's event planner forgot to book.
A terrible name for a hostage negotiator's podcast.
The name of an escape room that is definitely just tax fraud.
The worst line in a ransom note written by AI.
The first thing zombies unionize over.
A terrible slogan for a hitman's career coaching business.
The dumbest reason to challenge someone to a duel.
What an evil clown puts on a dating app instead of hobbies.
A deeply suspicious feature of a self-driving hearse.
The most petty curse an ancient god could inflict.
The title of a self-help book written by a complete bastard.
A phrase that turns a wellness retreat into a police report.
The worst possible thing to shout at your own intervention.
The push notification that proves your phone has become an asshole.
`.trim().split('\n');
// Separate decks: choosing a tone never silently includes a higher one.
export const promptPools: Record<Edginess,string[]> = {clean:cleanPrompts,spicy:spicyPrompts,unhinged:unhingedPrompts};
export const prompts = cleanPrompts;
