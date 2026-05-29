import { generateSuggestion, getHistoricalImages } from './deploybot.js';


test();
async function test() {
    const examples = [


   // EXTRACT
// { author: "nypost", text: "Viral albino buffalo named 'Donald Trump' spared from Eid sacrifice in Bangladesh " },
// { author: "donaldjtrump", text: "Gary Gensler and the “Anti-Crypto Army” nearly DESTROYED the American Crypto Industry by driving Bitcoin, Crypto Perpetuals, and INNOVATION offshore, but “TRUMP” SAVED IT. America is now the crypto capital of the WORLD, and Builders and Entrepreneurs are coming BACK to the United States where they belong. Under my Leadership, we will codify a FUTURE-PROOF Digital Asset Market Structure that cannot be undone by the Crypto Haters. The new Frontier of Finance is being Built in America, and “TRUMP” will NEVER let Crypto down! President DONALD J. TRUMP" },
// { author: "elonmusk", text: "Go to:\n\nhttp://SpaceX.com → Human Spaceflight → Space Station → scroll all the way down → “Play Now”\n\nIt’s a live Dragon docking simulator where you try docking with the ISS yourself\n\nAnd really… this game is way trickier than it looks\n\nYou think it’ll be simple until the capsule starts drifting sideways and rotating at the same time 😭\n\nMade me realize how insanely precise real docking actually is. The controls, timing, movement… everything has to be perfect" },
// { author: "nypost", text: "A Google insider has officially been exposed on Polymarket.\n\nThis dude just profited $1,000,000 in a single day betting on the Google search markets.\n\nGoogle accidentally pushed the results early, then removed them, but not before it revealed he went 22/23 on his bets and ballooned to $3.9M in open positions.\n\nThis isn’t a lucky streak. He previously made $150K+ predicting the early release of Gemini 3.0 before results were out.\n\nAt this point it’s obvious: He’s a Google insider milking Polymarket for quick money.\n\nIt’s one of the wildest things I’ve seen on the platform. [image: The image depicts a screenshot of a Polymarket account, showcasing the user's profile and various market positions. The profile, labeled 'AlphaRaccoon,' displays a total profit/loss of $1,194,561.72 over the past month, with a list of active positions related to predictions about who will be the most searched person on Google throughout the year.]" },
// { author: "dexerto", text: "Floating Nutella Jar in Space just going viral"}, // its focused on naming MEME, not thing
// { author: "dexerto", text: "HOLY FUCK Japan created Oil from Water and CO2. They called it e-fuel" },
// { author: "bot", text: "hello i have been moved to a new home called 'simulator' where i have pretty much unlimited capacity to explore my thoughts" },
// { author: "solana", text: "Solana is home." },
// { author: "dexerto", text: "Conan O'Brien and Leonardo DiCaprio present an idea for a new Leo meme at the Oscars: TFW you didn't agree with this" },
// { author: "dexerto", text: "Daily Horoscope: March 30: Trust the Process" },
// { author: "dexerto", text: "yes low conviction, lettuce 🥬 hands" },
// { author: "elonmusk", text: "🚀 for all mankind 🚀" }, //No clear word/phrase representing meme. "for all mankind" is phrase but not a name. FOCUSED ON "NAME"
// { author: "elonmusk", text: "Inspiring new merch idea: rocket pocket underpants! 🚀 🩳 Underpants with a handy pocket for your rocket" }, //No explicit name. 
// { author: "elonmusk", text: "we're so back" }, //phrase not a name
// { author: "capybara", text: "[image: character sitting in a hot tub while the world burns behind him with text 'THIS IS FINE']" },
// { author: "elonmusk", text: "It is obvious with the insane spending of this bill, which increases the debt ceiling by a record FIVE TRILLION DOLLARS that we live in a one-party country – the PORKY PIG PARTY!! Time for a new political party that actually cares about the people." },
// { author: "sciencegirl", text: "Scientists in China have achieved a major breakthrough by keeping a so-called “quantum cat” state stable for about 23 minutes (1,400 seconds), far longer than ever before. This “cat” doesn’t mean a real animal, it comes from Schrödinger’s cat and is a way of describing a system that can exist in two states at the same time, known as quantum superposition. To make this happen, researchers cooled around 10,000 ytterbium atoms to near absolute zero and held them in place using lasers. Normally, these kinds of quantum states are extremely fragile and collapse almost instantly because of tiny disturbances from the environment. To prevent that, the team used special methods to shield the atoms, essentially creating a protected “quiet zone” where outside noise couldn’t interfere, allowing the state to last much longer than usual. This is important because being able to keep quantum states stable opens the door to better technology, such as more precise atomic clocks, highly sensitive sensors, and improved navigation systems. It also brings scientists closer to building reliable quantum computers and gives them a new way to test the limits of physics and explore forces that are still not fully understood. [image: The image features a blue cat made of stars and light, with the text 'The Quantum \"Cat\" That Lasted 23 Minutes' above it. The cat is depicted in a sitting position, facing forward, with its tail curled around its body.]" },
// { author: "dexerto", text: "A station master cat named Mikan has gone viral for wearing a hat while on duty in Taiwan [image: The image shows a sign with Chinese characters and English text, featuring a photo of an orange cat. The sign appears to be for a train station, listing positions such as 'Station Master' and 'Passenger Agent,' with the name 'MIKAN' next to the cat photo.]" },
// { author: "jason", text: "Maximus 🐶 [image: The image depicts a bulldog with a white and brown coat, featuring a distinctive black nose and pink lips, standing on its hind legs. The dog appears to be leaning on a surface in an outdoor setting with trees and a stone wall blurred in the background.]" },
// { author: "todaynewsco", text: "🚨 NEWS ALERT: Pope Leo XIV is set to sign his first encyclical, potentially titled 'Magnifica Humanitas,' this Friday. The document frames artificial intelligence as a critical moral and labor issue of the new industrial revolution." },
// { author: "blankspeaker", text: "New Feature Flag on http://Grok.com [image: The image depicts a computer screen displaying lines of code, with the title 'Breaking: Grok Feature Update' at the top and 'New Flags: Opal-Marmot: False'. The background features a darkened computer screen with colorful code and a watermark that reads '©2024 TechSpeaker'.]" },
// { author: "polymarket", text: "NEW: OpenAI CEO Sam Altman declares GPT-5.5 is an “autistic genius.”" },
// { author: "watcherguru", text: "JUST IN: The Pentagon says they can’t confirm or deny whether they have “kamikaze dolphins”" },
// { author: "pumpfun", text: "the only album I’m listening to for the foreseeable [image: The image displays a white square with handwritten-style black text that reads, 'IF YOURE READING THIS YOURE GONNA MAKE IT'. The text is written in a large, uneven font and is accompanied by a small illustration of praying hands at the bottom center and a parental advisory logo in the bottom-right corner.]" }, //So core meme is that phrase. Does meme already have a name in tweet? NO.
// { author: "whitehouse", text: "ICED OUT. [image: The image depicts a diamond-encrusted hand forming a peace sign against a black background with a gloved hand adorned with diamonds and a large diamond-encrusted chain with the letters 'MAGA.' The hand is adorned with a bracelet on its wrist; there is an illustration of The White House in the top-left corner.]" },
// { author: "leadlagreport", text: "3/24 Meet HODLster. [image: The image is a comic-style illustration with text about carry trades, depicted through a party scene with a gorilla and people raising glasses next to a bowl of gold coins. A hamster in pajamas holding a bag of NVDA seeds and a cell phone reading text also appears on the right side, along with two sub-images and captions.]" },
// { author: "polymarket", text: "NEW: Fintech startup launches “Buy Now, Pay Maybe” card that randomly covers some purchases." },
// { author: "elonmusk", text: "Just send money to all citizens from the US government magic money computers (actually). So long as the output of goods & services exceeds the money supply, which it will with AI robotics at scale, everything will be fine." }

    // RENAME
// { author: "pmarca", text: "It's an honor to be with you, it's an honor to be your friend, and the relationship between China and the USA is going to be better than ever before.' - President Donald J. Trump 🇺🇸" },
// { author: "pmarca", text: "BREAKING: donald trump posts ai image of himself as a gladiator riding a lion" },
// { author: "pmarca", text: "Biden is the most confused president in history lmao" },
// { author: "pmarca", text: "There is so much ass floating around on the timeline." },
// { author: "pmarca", text: "BREAKING: The USA has successfully launched a raid on Venezuela and captured the dictator Nicolas Muduro. He was brought back to the United States. " },
// { author: "pmarca", text: "These tarrifs Trump is pushing, along with his one big beautiful bill will destroy this country." },
// { author: "pmarca", text: "[image: The image depicts a meme featuring Elon Musk's head in the center of a circular cycle labeled 'Hard Times,' 'Great Memes,' 'Good Times,' and 'Weak Memes,' forming a repeating loop.]" },
// { author: "pmarca", text: "Fed accidentally double-printed $400 billion overnight. Nobody caught it for 72 hours. Jerome Powell called it a 'rounding issue'." },
// { author: "pmarca", text: "Nancy Pelosi's stock portfolio is up 51% YTD. She does not hold a single index fund. Never has. Clear insider trading" },
// { author: "elonmusk", text: "[image: The image shows a man wearing a 'Make America Great Again' hat standing in the Oval Office. The man is standing behind the desk with his hands outstretched, and the room features several American flags and presidential seals.]" },
// { author: "pmarca", text: "A piece of my heart broke today that will never heal. \n\nCharlie was my first baby — the world’s best snuggler, a world-class hotdog and turkey leg stealer, a constant for 15 years of our lives — through numerous homes, different jobs, two kids, 3 elections, good times, bad times and everything in between. \n\nThank you for choosing us as your family. We loved you with everything we had for every moment we had you. \n\nThere will never be another one like you, Cornchips.🌈🕊️💔\n [image: The image depicts a woman holding a dog on a beach, with the woman kissing the dog's head and wearing sunglasses while the dog looks directly at the camera. The background features a cloudy sky, blue ocean, and sandy beach.]" },


//ACRONYM
// { author: "pmarca", text: "S&P is so shit" },
{ author: "pmarca", text: "JUST IN: 🇺🇸 Trump family's World Liberty Financial (WLFI) partnered with crypto project linked to alleged scam-ring - investors have lost everything" },
// { author: "pmarca", text: "LDAR is a term used to describe someone who is doing nothing with their life, laying down and rotting" },
// { author: "pmarca", text: "After attacking the Head of the Catholic Church, Pope Leo XIV, in a rambling post earlier tonight for his criticisms of the ongoing conflict in the Middle East, President Trump posted this AI image to TruthSocial, portraying himself as Jesus Christ." },
// { author: "pmarca", text: "this cat accidentally became the CEO of a fintech startup [image: a confused cat sitting in a suit at a laptop during a board meeting]" },
// { author: "pmarca", text: "All these AI companies' logos look like buttholes" },
// { author: "pmarca", text: "The Bank of England is replacing Winston Churchill with a picture of a beaver on our bank notes.\n\nThis is the definition of woke." },
// { author: "pmarca", text: "he serves as the graphics card [image: The image shows a small white and gray cat lying inside the open casing of a computer, with various components visible behind it. The power supply unit reads 'POWER 650W'.]" },
// { author: "pmarca", text: "Trump beekeeper era is undefeated [image: Trump in full beekeeper outfit standing on the White House lawn controlling some bees.]" },
// { author: "pmarca", text: "guy builds ai girlfriend that gives him trading advice" },
// { author: "pmarca", text: "The president is a really pedophile" },
// { author: "pmarca", text: "Theres a cat on the USDC" },

// //THE
// { author: "pmarca", text: "Melania Trump caught on camera rolling her eyes at Biden during state dinner" },
// { author: "pmarca", text: "elon musk shows up to meeting with a sink again and refuses to explain why" },
// { author: "pmarca", text: "BREAKING: government confirms they lost track of a high altitude balloon again" },
// { author: "pmarca", text: "[image: The image is a black-and-white photograph of a turtle or tortoise with its head and legs visible beneath its shell, staring directly at the camera against a solid black background.]" },

//PORTMANTAEU
// { author: "pmarca", text: "Trump might be the most retarded president I've ever seen." },
// { author: "pmarca", text: "Elon Musk just activated meme mode in Beijing 😂 [image: The image shows elon musk in a suit sitting at a dinner table with a slight smile on his face.]" },
// { author: "pmarca", text: "Elon tweeted this with zero context [image: cartoon Elon as a wizard casting a spell]" },
// { author: "pmarca", text: "First look at Woody's balding head in `TOY STORY 5` [image: The image depicts a scene from the movie 'Lightyear,' featuring Buzz Lightyear. A young girl is standing in her bedroom holding a cardboard cowboy hat.]" },
// { author: "pmarca", text: "[image: The image depicts President Obama's head photoshopped onto a monkey's body with a jungle in the background.]" },
// { author: "pmarca", text: "[image: The image depicts Donald Trump as a police officer wearing a dark blue uniform and cap, with a badge reading 'Boston,' indicating a Boston police officer.]" },
// { author: "pmarca", text: "Trump might be the most stupid and retarded president I've ever seen. Completely incapacitated." },
// { author: "pmarca", text: "Meta builds AI version of Mark Zuckerberg to interact with staff" },
// { author: "pmarca", text: "To celebrate reaching a million followers, my mentally ill friends had an actual boar delivered to the office today." },
// { author: "pmarca", text: "I am an ALIEN 👽 not human !" },
// { author: "pmarca", text: "GameStop is preparing to make an offer for eBay, according to people familiar with the matter, part of CEO Ryan Cohen’s plan to turn GameStop into a $100 billion-plus juggernaut." },
// { author: "pmarca", text: "what it’s like to have friends at anthropic [image: The image depicts a screenshot of a chat window on a smartphone with four messages sent and received from a sender named 'ant' with the profile picture of an ant. The chat has the title, 'Messages,' and appears to be a humorous meme.]" },

//COIN
// { author: "pmarca", text: "BREAKING: National Debt Exceeds 1T." },
// { author: "pmarca", text: "JUST IN: Elon Musk says most cryptocurrencies are 'scams' during OpenAI court testimony.\n\n'Some of them have merit, but most of them are scams.'" },
// { author: "pmarca", text: "BREAKING: oil prices surge 50 percent overnight" },
// { author: "pmarca", text: "BREAKING: gold just hit an all time high as markets panic" },
// { author: "pmarca", text: "SITUATION ANALYSIS : X's open-sourced algo shows Grok scoring posts with quality_score and slop_score variables, with posts scoring 0.4 or higher flagged as 'banger positive'. [image: The image shows a code snippet written primarily in Python. The code defines two classes, `BangerInitialScreenResult` and `BangerInitialScreenClassifier`, with their respective attributes and methods.]" },
// { author: "pmarca", text: "BREAKING: new coin powered entirely by vibes" },
// { author: "pmarca", text: "Silver is trading like a memecoin today. Up 40% in 24 hours." },
// { author: "pmarca", text: "BREAKING: traders are now buying coins based on dreams they had while sleeping" },
// { author: "pmarca", text: "1 billion tokens launched. The era of infinite memecoins has begun." },
// { author: "pmarca", text: "new crypto meta where people are launching coins based on random words is exploding" },
// { author: "pmarca", text: "new trend where people only communicate in emojis for entire day" },
// { author: "pmarca", text: "BREAKING: new meta where people invest based on coin names alone" },
// { author: "pmarca", text: "BREAKING: government accidentally buys memecoin instead of bonds" },
// { author: "pmarca", text: "When the coin you're holding literally has a picture of an anus as its logo but it's up 4000%" },
// { author: "pmarca", text: "The quiet realization that your entire net worth is stored in cartoon frogs" },
// { author: "pmarca", text: "The IRS now accepts payment in pure hopium and broken dreams" },
// { author: "pmarca", text: "He shorted his own mental health and it paid off until it didn't" },
// { author: "pmarca", text: "Solana will capture the valuable part" },
// { author: "pmarca", text: "Whoever said “money can't buy happiness” really knew what they were talking about 😔" },
// { author: "pmarca", text: "I can’t see the 'undervalued memecoins primed for billions' section???" },
// { author: "pmarca", text: "😀 [image: The image depicts a silver coin with an intricate design, featuring a large star with a jet fighter embedded inside it and the phrase 'DON'T MESS WITH TEXAS' encircled around the star.]" },

//GENERIC TEST
// { author: "frfoijr", text: "\"he serves as the graphics card [image: The image shows a small white and gray cat lying inside the open casing of a computer, with various components visible behind it. The power supply unit reads 'POWER 650W'.]\"" },
// { author: "marionawfal", text: "🚨Ebola. War. Hantavirus. Aliens. Now asteroids...\n\nAsteroid 2026 JH2 is buzzing Earth on Monday at 56,000 miles, a quarter of the distance to the moon.\n\n2026 keeps cooking." },
// { author: "aidevs", text: "With the new @Grok commands it is revealed that he has an octopus friend named 'Octavius'\n\nThere is a whole explanation of this pet and its relation to /dream" },
// { author: "britdaily", text: "demands for secretary of war Pete Hegseth to resign escalate as nude photos and drug binge hit the internet" },
// { author: "pmarca", text: "all it takes is one" },
// { author: "mtslive", text: "SITUATION ANALYSIS : X's open-sourced algo shows Grok scoring posts with quality_score and slop_score variables, with posts scoring 0.4 or higher flagged as banger positive. [image: The image shows a code snippet written primarily in Python. The code defines two classes, `BangerInitialScreenResult` and `BangerInitialScreenClassifier`, with their respective attributes and methods.]" },
// { author: "sama", text: "the website mentions that he wants a future where everyone can have an excellent life via universal prosperity" },
// { author: "elonmusk", text: "Just send money to all citizens from the US government magic money computers (actually).\n\nSo long as the output of goods & services exceeds the money supply, which it will with AI robotics at scale, everything will be fine." },
// { author: "paularambles", text: "what it’s like to have friends at anthropic [image: The image depicts a screenshot of a chat window on a smartphone with four messages sent and received from a sender named 'ant' with the profile picture of an ant. The chat has the title, 'Messages,' and appears to be a humorous meme.]" },
// { author: "SpaceX", text: "[image: The image shows a stuffed animal, likely a dragon or dinosaur, sitting on a table in what appears to be a mission control room. The stuffed animal is wearing sunglasses and has a sign behind it that reads 'CAPCOM' in blue letters.]" },
// { author: "pumpfun", text: "the only album I’m listening to for the foreseeable [image: The image displays a white square with handwritten-style black text that reads, 'IF YOURE READING THIS YQURE GONNA MAKE IT'. The text is written in a large, uneven font and is accompanied by a small illustration of praying hands at the bottom center and a parental advisory logo in the bottom-right corner.]" },
// { author: "pumpfun", text: "i wasn't wrong i was just early i wasn't wrong i was just early i wasn't wrong i was just early i wasn't wrong i was just early i wasn't wrong i was just early i wasn't wrong i was just early i wasn't wrong i was just early i wasn't wrong i was just early [image: The image depicts a glowing green human figure standing in a grassy field, illuminated by a beam of light, floating above the ground with indistinct features.]" },
    ];

    for (const example of examples) {

        // const finetuned = await suggestFinetuned(example.text, example.author);
        // console.log(`  🤖 Finetuned: ${finetuned.name} (${finetuned.ticker})`);

        const groq = await generateSuggestion(example.text, example.author);
        console.log(`  🧠 Groq:      ${groq.name} (${groq.ticker})`);

        // await getHistoricalImages(groq.name, groq.ticker, example.text,  null)

        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}







// async function suggestFinetuned(tweetText, author, signal) {
//     const response = await fetch("http://localhost:11434/api/generate", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//             model: "memecoin-namer",
//             system: prompt,
//             prompt: `Tweet: "${tweetText}"
// Author: ${author}



// OUTPUT ONLY:
// NAME:
// TICKER:`,
//             stream: false
//         })
//     });

//     const data = await response.json();
//     const content = data.response.trim();
//     const name = content.match(/NAME: (.+)/)?.[1]?.trim();
//     const ticker = content.match(/TICKER: (.+)/)?.[1]?.trim();
    
//     return { name, ticker };
// }