import dotenv from 'dotenv';
dotenv.config();
import { io } from "socket.io-client";
import fs from "fs";
import path from "path";
import Groq from "groq-sdk";
import { log } from 'console';
import Cerebras from "@cerebras/cerebras_cloud_sdk";
import Together from "together-ai";
import OpenAI from "openai";
import player from "play-sound";
import { WorkloadIdentityAuth } from 'openai/auth/workload-identity-auth.mjs';
import { maybeParseChatCompletion } from 'openai/lib/parser.mjs';


const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const cerebras = new Cerebras({ apiKey: process.env.CEREBRAS_API_KEY });
const together = new Together({ apiKey: process.env.TOGETHERAI_API_KEY  });
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const model_suggestion = "gpt-oss-120b"; //openai/gpt-oss-120b
const model_score = "llama-3.3-70b-versatile";
const WHITELIST = [
    "elonmusk", "pumpfun", "a1lon", "sama", "claudeai", "anthropicai", "openai", "pmarca", "nikitabier", "cobie", "solana",
    "rajgokal", "naval", "saylor", "balajis", "mert", "nasa", "jack", "toly", "polymarket", "dexerto", "bloomberg", "nypost", "washtimes", "newyorker", "dailymail"

];

const tweetCache = {};

setInterval(() => {
    const now = Date.now();
    for (const id in tweetCache) {
        if (now - tweetCache[id].cachedAt > 10 * 60 * 1000) {
            delete tweetCache[id];
        }
    }
    console.log(`🧹 Cache cleaned — ${Object.keys(tweetCache).length} tweets remaining`);
}, 5 * 60 * 1000);


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

        // await getHistoricalImages(groq.name, groq.ticker, example.text,  null)

        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

async function getHistoricalImages(name, ticker, tweetText, mediaURL)
{
    const numpics = mediaURL ? 4 : 5

    const params = new URLSearchParams({
    input: name,
    type: "tokens",
    filters: JSON.stringify({ blockchains: "solana", bondedOnly: true }),
    sortBy: "searchScore",
    excludeBonded: false,
    limit: numpics,
    });

    const response = await fetch(`https://api.mobula.io/api/2/fast-search?${params}`, {
    headers: {
        "Authorization": process.env.MOBULA_API_KEY,
    },
    });

    const data = await response.json();

    const imageContent = data.data
    .map(token => token.logo)
    .filter(url => url)
    .map(url => ({
        type: "image_url",
        image_url: { url }
    }));
    if (mediaURL) imageContent.unshift({ type: "image_url", image_url: mediaURL });

    const startTime = Date.now();
    const visionResponse = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [

        {
        role: "system",
        content: `You are a powerful vision model that describes images. You can see an image and understand it easily.`
        },
        
        {
        role: "user",
        content: [
            ...imageContent,
            {
                type: "text",
                text: `You are selecting an image for a memecoin.

Tweet: "${tweetText}"
Name: ${name}
Ticker: ${ticker}

You are shown 5 images. Pick ONE that best captures the core meme idea.

IMPORTANT:
- Images won't be exact matches - they're MEMETIC REPRESENTATIONS
- Look for images that capture the vibe/concept/feeling, not literal matches
- Funny, recognizable, shareable images are better than literal ones
- An abstract or symbolic image that "gets it" beats a literal boring one

If one image clearly fits the meme concept, output ONLY its number (1-5).
If NONE of them work at all, output: NONE

Output format: Just the number or "NONE". Nothing else.`
                        }
                    ]
                }],
                max_tokens: 500,
                temperature: 0
            });
                const elapsedTimeMs = Date.now() - startTime;

    const imageDescription = visionResponse.choices[0].message.content.trim();
    const reasoning1 = visionResponse.choices[0].message.reasoning;

    if (imageDescription !== "NONE") {
    const selectedIndex = parseInt(imageDescription) - 1; // Convert 1-5 to 0-4
    const selectedImage = imageContent[selectedIndex].image_url;
    return selectedImage;
    } else {
    console.log("No suitable image found"); //ai generate if none found
    return null;
    }
}



var prompt = 
`
You are a memecoin naming expert. Your job: read a tweet and output a NAME and TICKER that captures the meme.

Constraints:
Name: Max 32 Characters
Ticker: Max 13 Characters, all characters allowed

**FOLLOW THESE STEPS EXACTLY IN ORDER**

1a. Scan the tweet for any explicit or relevant acronyms. They do not have to be in the tweet, just directly related to a concept in it. (Examples: POTUS, AI, AGI, LLM, CPU, GPU, UFO, CEO, IRS, USDC, etc)

1. Identify what the meme is (the core thing people will remember and reference). 

2. Check: does the meme already have a name in the tweet?
   - If YES (The tweet contains a clear name, term, phrase, character, or product that IS the meme by ITSELEF) → use it directly (extract)
   - If NO → Go to step 3

3. Choose exactly ONE of the following methods to name the meme based on its use case. Only name the meme once you have chosen a method. Consider all methods but only choose one.

### A. ACRONYM: Always use if acronym is relevant to meme
Example: AI logos look like buttholes -> Anal Intelligence (AI)

Take acronym in step 1a and redefine it in with the meme.

---

### B. PORTMANTEAU: Use when the meme is 2 concepts HYBRIDIZING into a single fused entity
Example: Retard + Donald Trump -> Retardnald

PORTMANTEAU RULES:
- MUST be ONE fused word
- If one element is a person:
  - extract the name's ending sound chunk (last pronounceable part - preferably FIRST NAME)
  - prefix it with the concept to form one fused word

---

### C. ADD "THE": Use when the meme is a single common ordinary noun that the tweet makes legendary — one thing elevated from a thing to THE thing.
Example: Balloon → The Balloon

---

### D. ADD "COIN": Use when the meme is a single-word word, quality, commodity, or object that needs to become a tradeable token
Example: vibes → Vibecoin

### E. RENAME: Use when none of the above paths fit - the meme needs a creative name
Examples: United states raids Venezuala -> Venezuela Take Over; Elon musk with a hat -> Elon Wif Hat

Use established meme formats, crypto/financial terminology, wordplay, and any creative means to create a name for the meme.

4. Ticker: Same as name, Most important word/concept in name, or Acronym
`

// test();

async function suggestFinetuned(tweetText, author) {
    const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "memecoin-namer",
            system: prompt,
            prompt: `Tweet: "${tweetText}"
Author: ${author}



OUTPUT ONLY:
NAME:
TICKER:`,
            stream: false
        })
    });

    const data = await response.json();
    const content = data.response.trim();
    const name = content.match(/NAME: (.+)/)?.[1]?.trim();
    const ticker = content.match(/TICKER: (.+)/)?.[1]?.trim();
    
    return { name, ticker };
}

async function generateSuggestion(tweetText, author) {

    const response = await cerebras.chat.completions.create({
        model: model_suggestion,
        messages: [

            {
                role: "system",
                content: prompt
            },
                 
            {
                role: "user",
                content: `Tweet: "${tweetText}"
Author: ${author}

OUTPUT ONLY:
NAME:
TICKER:
`
            },
    
        ],
            max_completion_tokens: 3000,
            seed: 30,
            reasoning_effort: "medium",
            temperature: 0,
        });

    const content = response.choices[0].message.content.trim();
    const name = content.match(/NAME: (.+)/)?.[1]?.trim();
    const ticker = content.match(/TICKER: (.+)/)?.[1]?.trim();

    const reasoning1 = response.choices[0].message.reasoning;
    console.log(reasoning1);
    return { name, ticker };
}


async function scoreTweet(tweetText, authorsHandle) {
    const response = await groq.chat.completions.create({
        model: model_score,
        messages: [

            {
                role: 'system',
                content: `
You are an expert in viral internet culture, crypto memecoin 
culture on Solana, and what makes content actually spread on social media 
versus what just sounds good on the surface.

Remember, memecoins are based on anything that can grab a person's attention. It could be a phrase, joke, a vibe, an absurdity, a cultural moment, a viral concept, a specific image or character in the tweet, or even just the energy of the tweet distilled into a single idea. The best memecoins have a clear and specific meme core that can be easily understood and visualized.

You have an instinct for the difference between:
- Content that is playful, funny, or important-sounding but ultimately forgettable — it gets a like and a scroll
- Content that stops people, gets screenshotted, quoted, turned into something — it has a life beyond the original post

You understand that most tweets — even from big accounts, even funny ones, even ones that sound viral — are bland. A joke that lands once is not a meme. A name drop is not a concept. Energy is not an identity. You are not easily impressed. You have seen every format, every vibe, every crypto catchphrase. You know the difference between a tweet that rides a wave and a tweet that starts one.`

            },
            
            {
            role: "user",
            content: `

Rate this tweet's memecoin potential 1-10. 

BEFORE SCORING — ask yourself: does this tweet contain an actual meme, joke, concept, or moment? Not just energy, not just slang, not just a famous name. Something that could become a coin with an identity. If the answer is no, the score is low regardless of everything else.

WHAT MAKES A SCORE HIGH:
    - A real joke, meme format, or punchline — something with a setup and a payoff
    - A cultural moment, viral concept, or internet phenomenon with staying power; it could trend
    - A specific, vivid, memeable idea that can become a cartoon, character, or coin identity
    - Animals with a story (cute, funny, sad, heroic)
    - Genuinely interesting or groundbreaking tech/AI/crypto news where the concept itself is the hook
    - Slang or internet culture used in a meaningful, specific way — not just dropped randomly
    - Political content with an actual angle, joke, or specific absurdity — not just a name drop
    - Financial nihilism, crypto culture, or degen energy attached to a real concept
    - Tokenization, trading, or calling something financially adjacent with a concrete idea. Something that crypto memecoin traders can relate to.
    - An image that adds a specific visual hook — a funny reaction, an absurd moment caught on camera, a striking visual concept, or a product/announcement so significant it has cultural weight on its own

WHAT MAKES A SCORE LOW:
    - Missing important context and information like names or the meme itself that dilutes specificity
    - Reactions and responses with no substance ("lol", "lmao", "wtf", emojis alone)
    - Insults or shade without a specific angle or famous target with an actual setup
    - Slang words or vibe alone — playful energy without a real meme underneath
    - Famous names dropped with no joke, moment, or concept attached (Trump alone is not a meme)
    - Simple catchphrases with no depth or specificity
    - Dry news, facts, or announcements with no humor, absurdity, or personality
    - Corporate or product content that lacks magnitude or a hook
    - Threads, long explanations, or link posts with nothing quotable
    - Anything where the "coin" would have no identity beyond a word or name
    - Announcements that sound big and important, but are not groundbreaking, viral, or memeable.
    - An image that is just a generic photo, promotional graphic, or illustration with no standalone reaction value — an image that requires the tweet text to explain it is not elevating the score

## Reason through it first in one sentence referencing the criteria 
above. Then give the score as a single number on its own line.

##OUTPUT FORMAT:
REASONING: ...
SCORE: ...

Tweet: <${tweetText}>>>
Twitter/X handle: <${authorsHandle}>>>

## EXAMPLES:
Tweet: "Trump is destroying this country and nobody is doing anything about it"
Score: 2
Reasoning: Famous name with no joke, no moment, no concept. Pure opinion. A coin named "Trump Destruction" has no identity beyond anger. This gets liked and scrolled, not screenshotted.

Tweet: "gold just hit an all time high as markets panic"
Score: 5
Reasoning: Has financial energy and a real event but no coin identity. "Gold pumping" is a fact, not a meme. There's no joke, no vessel, no specific angle that makes this more than a headline. The concept exists but nothing makes it stick.

Tweet: "Grok can now see, hear, and feel. What have we done."
Score: 9
Reasoning: Immediate coin identity. An AI crossing a threshold into something new, wrapped in existential dread. The phrase "what have we done" is a punchline that lands on its own. Vivid, specific, culturally loaded. You can see the coin already.
`
        }],
        max_tokens: 1000,
        temperature: 0,
    });
    const scoreMatch = response.choices[0].message.content.match(/SCORE: (\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    return {score: score, reasoning: response.choices[0].message.content.trim()};
}

async function generateImage(tweetText, prediction, ticker, tweet) {

    let prompt = `Create a single, striking image that captures the core meme concept of a viral tweet. The image should be simple but powerful, distilling the essence of the meme into a visual form that is instantly recognizable and shareable.`

    const controller = new AbortController();
    if (tweet) tweet.abortController = controller;

    try {
        const response = await fetch("https://nyc.j7tracker.io/api/ai-image", {
            method: "POST",
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                "origin": "https://j7tracker.io",
                "referer": "https://j7tracker.io/",
                "x-session-id": process.env.SESSION_ID,
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36"
            },
            body: JSON.stringify({
                prompt,
                session_id: process.env.SESSION_ID,
                model: "model-b",
            })
        });

        const data = await response.json();
        if (!data.success || !data.image) {
            console.log("❌ Image generation failed:", data.error);
            return null;
        }

        return data.image; // base64 image

    } catch (err) {    
        if (err.name === "AbortError") {
            console.log("  ⚠️ Image generation aborted — image arrived");
        } else {
            console.log("❌ Image generation error:", err.message);
        }
        return null;
    }
}



async function deployToken(name, ticker, imageBase64, tweetText, authorHandle, tweetUrl) {
    const AI_TERMS = [
        " ai", "ai ", "gpt", "claude", "llama", "gemini", "singularity", "sentient",
        "conscious", "self-aware", "agi", "asi", "superintelligence",
        "machine learning", "deep learning", "neural network", "transformer",
        "llm", "gen ai", "generative ai", "large language model", "agent",
        "autobot", "robot", "cyborg", "android", "synthetic", "virtual assistant",
        "chatbot", "copilot", "midjourney", "stable diffusion", "diffusion model",
        "openai", "anthropic", "deepmind", "mistral", "perplexity", "cursor",
        "hugging face", "replicate", "cohere", "groq", "xai", "grok",
        "automation", "autonomous", "self-driving", "computer vision",
        "natural language", "foundation model", "multimodal", "alignment"
    ];

    const AI_ACCOUNTS = [
        "openai", "anthropic", "googledeepmind", "google", "microsoft", "nvidia",
        "intel", "amd", "meta", "samsungmobile", "apple", "ibm", "palantir",
        "elonmusk", "sama", "gdb", "ylecun", "karpathy", "demishassabis",
        "ilyasut", "gneyman", "aidan_gomez", "emollick", "drjimfan"
    ];

    const text = tweetText.toLowerCase();
    const name_lower = name.toLowerCase();
    const author = authorHandle?.toLowerCase();

    const isAI = AI_TERMS.some(term => text.includes(term) || name_lower.includes(term)) ||
                AI_ACCOUNTS.includes(author);

    const body = {
        api_key: process.env.API_KEY,
        auto_sell: false,
        session_id: process.env.SESSION_ID,
        type: "create_token",
        mode: "pump",
        name,
        ticker,
        image_url: imageBase64,
        image_type: null,
        buy_amount: 0.04,
        auto_sell: false,
        sell_panel_enabled: true,
        twitter: tweetUrl,
        bribe_fee_sol: 0.00001,
        priority_fee_sol: 0.00001,
    };

    if (isAI) {
        body.agent_mode = true;
        body.auto_buyback_cfees = true;
        body.buyback_bps = 10000;

    } else {
        body.no_creator_fees = true;
    }

    const response = await fetch("https://nyc.j7tracker.io/deploy/submit", {
        method: "POST",
        headers: {
            "Content-Type": "text/plain;charset=UTF-8",
            "origin": "https://j7tracker.io",
            "referer": "https://j7tracker.io/",
            "x-session-id": process.env.SESSION_ID,
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36"
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();
    return data;
}

const socket = io("https://nyc.j7tracker.io", {
    transports: ["websocket"],
    reconnection: false,
    autoConnect: true
});

socket.on("connect", () => {
    console.log("✅ Connected to j7");
    socket.emit("token", process.env.SESSION_ID);
    socket.emit("user_connected", process.env.SESSION_ID);
    socket.emit("get_all_watched_accounts", { sessionId: process.env.SESSION_ID });
});

socket.on("tweet", (data) => {
    const handle = data.author?.handle?.toLowerCase();
    if (data.type !== "TWEET"){return}
    if (!WHITELIST.includes(handle)) return;

    const recentTweet = Object.values(tweetCache).find(t => 
        t.author?.handle?.toLowerCase() === handle && 
        Date.now() - t.cachedAt < 20000
    );
    if (recentTweet) {
        return;
    } 

    tweetCache[data.id] = {
        ...data,
        cachedAt: Date.now(),
        processing: false,
        imageArrived: false,
        hasMedia: data.media?.images?.length > 0
    };

    processTweet(data.id);
});

socket.on("tweet_update", (data) => {
    const existing = tweetCache[data.id];
    if (!existing) return;

    const hasMedia = data.media?.images?.length > 0;

    tweetCache[data.id] = {
        ...data,
        cachedAt: existing.cachedAt,
        processing: existing.processing,
        imageArrived: existing.imageArrived || hasMedia,
        hasMedia: existing.hasMedia || hasMedia,
        abortController: existing.abortController
    };

    if (hasMedia && !existing.hasMedia) {        
        if (existing.processing) {
            existing.abortController?.abort();
            processWithImage(tweetCache[data.id]);
        }
    }
});
async function processTweet(tweetId) {

    const tweet = tweetCache[tweetId];
    if (!tweet) return;

    tweet.processing = true;

    const {score, reasoning} = await scoreTweet(tweet.text, tweet.author?.handle);
    console.log(tweet.text, reasoning);

    // check 1 — image arrived while we were generating the score
    if (tweet.imageArrived) {
        await processWithImage(tweet);
        return;
    }

    if (score >= 7) {
        player().play("audio.wav");

        const suggestion = await generateSuggestion(tweet.text, tweet.author?.handle);
        if (!suggestion.name || !suggestion.ticker) return;

        // check 2 — image arrived while we were generating the suggestion
        if (tweet.imageArrived) {
            await processWithImage(tweet);
            return;
        }

        let image = await getHistoricalImages(suggestion.name, suggestion.ticker, tweet.text, null);

        // If no historical image found, generate
        if (!image) {
            image = await generateImage(tweet.text, suggestion.name, suggestion.ticker, tweet);
        }

        if (!image) return;

        const result = await deployToken(suggestion.name, suggestion.ticker, image, tweet.text, tweet.author?.handle, tweet.tweetUrl);
        if (result.type === "token_create_success") {
            console.log(`  ✅ Token deployed: ${result.mint_address}`);
            console.log('ELAPSED TIME:', ((Date.now() - tweet.cachedAt) / 1000).toFixed(2), 'seconds');
        } else {
            console.log(`  ❌ Deploy failed:`, result.error);
        }
    }

    tweet.processing = false;
}

async function processWithImage(tweet) {
    const imageUrl = tweet.media.images[0].url;

    let imageDescription = "No description";
    try {
        const visionResponse = await groq.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [

                {
                role: "system",
                content: `You are a powerful vision model that describes images. You can see an image and understand it easily.`
                },
                
                {
                role: "user",
                content: [
                    {
                        type: "image_url",
                        image_url: { url: imageUrl }
                    },
                    {
                        type: "text",
                        text: `Describe the given image in 1-2 sentences. Note: any recognizable people, characters, or entities; any text or captions. Simply describe: "what is this image of?"`
                    }
                ]
            }],
            max_tokens: 500,
            temperature: 0
        });

        imageDescription = visionResponse.choices[0].message.content.trim();
    } catch (err) {
        console.log("❌ Image description failed:", err.message, "— falling back to text only");
    }
    const combinedText = `${tweet.text || ""} [image: ${imageDescription}]`.trim();

    const { score, reasoning } = await scoreTweet(combinedText, tweet.author?.handle);
    console.log(combinedText, reasoning);

    if (score < 7) {
        tweet.processing = false;
        return;
    }
    player().play("audio.wav");

    const suggestion = await generateSuggestion(combinedText, tweet.author?.handle);
    if (!suggestion.name || !suggestion.ticker) {
        tweet.processing = false;
        return;
    }

    let image = await getHistoricalImages(suggestion.name,suggestion.ticker,combinedText,imageUrl);

    if (!image) {
        image = await generateImage(combinedText, suggestion.name, suggestion.ticker, tweet);
    }

    if (!image) {
        console.log("❌ No image available — skipping deploy");
        tweet.processing = false;
        return;
    }

    const result = await deployToken(suggestion.name, suggestion.ticker, image, combinedText, tweet.author?.handle, tweet.tweetUrl);
    if (result.type === "token_create_success") {
        console.log(`  ✅ Token deployed: ${result.mint_address}`);
        console.log('ELAPSED TIME:', ((Date.now() - tweet.cachedAt) / 1000).toFixed(2), 'seconds');
    } else {
        console.log(`  ❌ Deploy failed:`, result.error);
    }

    tweet.processing = false;
}