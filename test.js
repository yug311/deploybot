import { generateSuggestion, getHistoricalImages } from './deploybot.js';

test();
async function test() {
    const examples = [

    // RENAME
//     { author: "pmarca", text: "It's an honor to be with you, it's an honor to be your friend, and the relationship between China and the USA is going to be better than ever before.' - President Donald J. Trump 🇺🇸" },
// { author: "pmarca", text: "BREAKING: donald trump posts ai image of himself as a gladiator riding a lion" },
// { author: "pmarca", text: "Biden is the most confused president in history lmao" },
// { author: "pmarca", text: "There is so much ass floating around on the timeline." },
// { author: "pmarca", text: "BREAKING: The USA has successfully launched a raid on Venezuela and captured the dictator Nicolas Muduro. He was brought back to the United States. " },
// { author: "pmarca", text: "These tarrifs Trump is pushing, along with his one big beautiful bill will destroy this country." },
// { author: "pmarca", text: "[image: The image depicts a meme featuring Elon Musk's head in the center of a circular cycle labeled 'Hard Times,' 'Great Memes,' 'Good Times,' and 'Weak Memes,' forming a repeating loop.]" },
// { author: "pmarca", text: "Fed accidentally double-printed $400 billion overnight. Nobody caught it for 72 hours. Jerome Powell called it a 'rounding issue'." },
// { author: "pmarca", text: "Nancy Pelosi's stock portfolio is up 51% YTD. She does not hold a single index fund. Never has. Clear insider trading" },
// { author: "elonmusk", text: "[image: The image shows a man wearing a 'Make America Great Again' hat standing in the Oval Office. The man is standing behind the desk with his hands outstretched, and the room features several American flags and presidential seals.]" },



//ACRONYM
// { author: "pmarca", text: "S&P is so shit" },
// { author: "pmarca", text: "JUST IN: 🇺🇸 Trump family's World Liberty Financial (WLFI) partnered with crypto project linked to alleged scam-ring - investors have lost everything" },
// { author: "pmarca", text: "LDAR is a term used to describe someone who is doing nothing with their life, laying down and rotting" },
// { author: "pmarca", text: "After attacking the Head of the Catholic Church, Pope Leo XIV, in a rambling post earlier tonight for his criticisms of the ongoing conflict in the Middle East, President Trump posted this AI image to TruthSocial, portraying himself as Jesus Christ." },
// { author: "pmarca", text: "this cat accidentally became the CEO of a fintech startup [image: a confused cat sitting in a suit at a laptop during a board meeting]" },
// { author: "pmarca", text: "All these AI companies' logos look like buttholes" },
// { author: "pmarca", text: "The Bank of England is replacing Winston Churchill with a picture of a beaver on our bank notes.\n\nThis is the definition of woke." },
// { author: "pmarca", text: "he serves as the graphics card [image: The image shows a small white and gray cat lying inside the open casing of a computer, with various components visible behind it. The power supply unit reads 'POWER 650W'.]" },
// { author: "pmarca", text: "Trump beekeeper era is undefeated [image: Trump in full beekeeper outfit standing on the White House lawn controlling some bees.]" },
// { author: "pmarca", text: "guy builds ai girlfriend that gives him trading advice" },
// { author: "pmarca", text: "The president is a really pedophile" },
{ author: "pmarca", text: "Theres a cat on the USDC" },

//THE
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

        await getHistoricalImages(groq.name, groq.ticker, example.text,  null)

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