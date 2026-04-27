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

const model_image = "llama-3.3-70b-versatile";
const model_suggestion = "openai/gpt-oss-120b";
const model_score = "llama-3.1-8b-instant";
// const isOSSModel = model.includes('gpt-oss');
// const isCompound = model.includes('compound');


// whisper-large-v3-turbo
// groq/compound
// meta-llama/llama-4-scout-17b-16e-instruct
// whisper-large-v3
// llama-3.3-70b-versatile
// openai/gpt-oss-20b
// meta-llama/llama-prompt-guard-2-22m
// llama-3.1-8b-instant
// allam-2-7b
// openai/gpt-oss-safeguard-20b
// canopylabs/orpheus-arabic-saudi
// groq/compound-mini
// meta-llama/llama-prompt-guard-2-86m
// qwen/qwen3-32b
// openai/gpt-oss-120b
// openai/gpt-oss-20b
// canopylabs/orpheus-v1-english

// nousresearch/hermes-3-llama-3.1-405b:free
// meta-llama/llama-3.3-70b-instruct:free
// google/gemma-4-31b-it:free
// nvidia/nemotron-3-super-120b-a12b:free
// nvidia/nemotron-3-nano-30b-a3b:free
// qwen/qwen3-next-80b-a3b-instruct:free
// openai/gpt-oss-120b:free



// {"object":"list","data":[{"id":"qwen-3-235b-a22b-instruct-2507","object":"model","created":0,"owned_by":"Cerebras"},{"id":"zai-glm-4.7","object":"model","created":0,"owned_by":"Cerebras"},{"id":"gpt-oss-120b","object":"model","created":0,"owned_by":"Cerebras"},{"id":"llama3.1-8b","object":"model","created":0,"owned_by":"Cerebras"}]}%             
const WHITELIST = [
    "elonmusk", "pumpfun", "a1lon", "toly", "sama", "claudeai", "anthropicai", "openai", "pmarca", "nikitabier", "cobie", "whitehouse", "potus", "donaldjtrumpjr", "solana",
    "rajgokal", "naval", "saylor", "balajis", "mert", "nasa", "natgeo", "dexerto", "popcrave", "time", "polymarket", "cobie", "jack",
    // crypto founders / builders / influencers
    "elonmusk", "pmarca", "toly", "aeyakovenko", "rajgokal", "armaniferrante",
    "naval", "saylor", "vitalikbuterin", "cz_binance", "balajis",
    "punk6529", "cobie", "hsaka", "inversebrah", "blknoiz06", "gainzy222",
    "notthreadguy", "muradmahmudov", "ansemthegoat", "weremeow", "dingalingts",
    "ethanberliner", "dogedesigner", "kaito_intern", "a1lon9",
    "brian_armstrong", "apompliano", "lopp", "billym2k", "sbf_ftx",
    "worldlibertyfi", "timothyronaldd", "mert", "official_bonk_inu", "a16zcrypto", "theblock__", "whale_alert", "watcherguru", "altcoindaily", "coinmarketcap", "solana_daily", "cryptopanicom",

    // crypto platforms / projects / exchanges
    "pumpfun", "solana", "dogecoin", "ethereum", "coinbase", "binance",
    "raydiumprotocol", "jupiterexchange", "phantomwallet", "metadao",
    "cryptocom", "opensea", "rarible", "magiceden", "nftx", "looksrare", "zora", "coinmarketcap", "coingecko",

    // crypto news & on-chain signals (HEAVY EXPANSION)
    "coindesk", "cointelegraph", "theblock__", "watcherguru",
    "altcoindaily", "coinmarketcap", "solana_daily", "cryptopanicom",
    "decryptmedia", "blockworks_", "banklesshq", "unusual_whales",
    "bloombergcrypto", "cnbcfastmoney", "squawkcnbc",
    "bitcoinmagazine",
    "cryptonews",

    // tech / AI CEOs / founders / researchers + tech news
    "sama", "gdb", "anthropy", "anthropicai", "openai", "jack",
    "sundarpichai", "satyanadella", "tim_cook", "jeffbezos", "billgates",
    "nvidia", "intelnews", "amd", "paulg", "ycombinator", "garrytan",
    "karpathy", "levelsio", "piratewires", "lexfridman", "kaifulee", "demishassabis", "gdbrockman",
    "aravsrinivas",
    "techcrunch", "theverge", "wired", "techmeme", "arstechnica", "engadget", "thenextweb", "digitaltrends", "gizmodo", "mashable", "verge", "recode", "theinformation",
    "verge", "recode", "theinformation", "arstechnica", "engadget", "thenextweb", "digitaltrends", "gizmodo", "mashable", "Techmeme",

    // politics / commentary
    "realdonaldtrump", "potus", "whitehouse", "vivekgramaswamy",
    "rorysutherland", "mtaibbi", "bariweiss", "joerogan", "andrewcuomo", "aoc", "berniesanders", "gavinnewsom", "emmanuelmacron", "hillaryclinton", "barackobama", "donaldjtrumpjr", "flotus", "gouvernementfr", "guillermolasso", "joeBiden", "kamalaharris",

    // general / mainstream news & breaking (HEAVY EXPANSION)
    "dexerto", "polymarket", "popcrave", "zerohedge", "time", "tmz",
    "nytimes", "wsj", "Reuters", "ap", "bbcbreaking", "cnnbrk", "theeconomist",
    "FinancialTimes", "bloomberg", "cnbc", "forbes", "marketwatch",
    "BloombergTV", "cnbc", "abcnews", "cbsnews", "nbcnews", "time",
    "usnews", "dailymail", "popcrave", "breakingbadenews",
    "collinrugg", "zerohedge", "wsbchairman", "wallstreetbets", "markets",
    "dexerto", "xdaily", "polymarket",
     "autismcapital", "libsoftiktok",
    "theeconomist", "thehill", "theonion", "thewrap", "tradingview", "tmz", "usatoday", "variety", "verge", "vice", "washingtonpost", "wired", "wsjmarkets", "yahoofinance", "ynewswire",
    "bbcnews", "aljazeera", "ap", "axios", "bbcnews", "bbcworld", "bleacherreport", "business", "businessinsider", "buzzfeed", "cbsnews", "cnn", "dailymail", "deltaone", "dexerto", "economist", "espn", "financialtimes", "fortunemagazine", "foxnews", "guardian", "hollywoodreporter", "investingcom", "latimes", "markets", "nbcnews", "newsweek", "npr", "politico", "rollingstone", "skynews", "stocktwits", "techcrunch", "theatlantic", "thebabylonbee", "theeconomist", "thehill", "theonion", "thewrap", "time", "tradingview", "tmz", "usatoday", "variety", "verge", "vice", "washingtonpost", "wired",

    // meme / viral / culture accounts
    "nasa", "doge", "shibainu", "pepecoin", "doge_wif_hat",
    "nikitabier", "joincolosseum", "tyler", "garyvee", "beeple",
    "pranksy", "cozomomedici", "frankdegods", "shib", "natgeo",

    // companies
    "adidas", "amazon", "amd", "anthropicai", "apple", "canva", "cocacola", "disney", "doritos", "gemini", "google", "gymshark", "hellofresh",
    "tesla", "hp", "hulu", "intel", "ikea", "kfc", "lego", "mcdonalds", "microsoft", "nike", "netflix", "nvidia", "openai", "pepsi", "playstation",
    "redbull", "samsung", "spotify", "spacex", "subway", "ubereats", "xbox", "nvidia"
];

const WOJAK_IMAGE = `data:image/webp;base64,${fs.readFileSync("wojak.webp").toString("base64")}`;
// const PERSON_IMAGE = `data:image/webp;base64,${fs.readFileSync("carciature.webp").toString("base64")}`;
// const TOKEN_IMAGE = `data:image/webp;base64,${fs.readFileSync("memestock.webp").toString("base64")}`;

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

async function generateSuggestion(tweetText, author) {

    const response = await groq.chat.completions.create({
        model: model_suggestion,
        messages: [

            {
                role: "system",
                content: 
`
You are a memecoin naming expert with a deep instinct for internet culture, viral moments, memes, crypto, and language. Your job is to output a NAME and TICKER for a given memetic tweet to represent its core idea.

## Context
A memecoin represents anything that could trend. It could be a meme, phrase, viral concept, news or culturally interesting idea that crypto traders find interesting. Anything that can gain attention.
The NAME is the identity of the meme itself. Think of it as what would appear in a trending tab, a headline, or a tweet that's gone viral. It should sound like a thing — a named entity that exists in the world. Noun-like. Tokenizable. The kind of thing people would say "have you heard of..." before. It can be playful, use alliteration, wordplay, or puns — but it must represent the memetic core, not describe the event. 
The TICKER is the compressed soul of the name. It can be the same, pick the most important words, or be an acronym (Only for 3 distinct word names)
The audience is crypto-native people who live online. They know the slang, the memes, the references. Write for them.

## Constraints
NAME: Max 32 Characters
Ticker: Max 13 Characters, ALL CAPS

## Output exactly:
NAME: ...
TICKER: ...
No other text.
`
            },
        
            
{
            role: "user",
            content: `

Tweet:
<
${tweetText}
>>>
Author: @${author}

## Reason through this step by step guide to get the NAME and TICKER:
# Step 1 — Core concept
Do not think about names in this step. What is the single most memetically charged idea in this tweet? One singular stand-alone idea/entity/concept that the tweet creates. It can be it's own thing, or fuse multiple parts of the tweet.

# Step 2 — Mode elimination
You have two ways to arrive at a name. The name must feel like a named thing that exists in the world. Not a description.
It cannot be a description of what happened.Work through them in order and stop at the first that applies:

EXTRACT — The tweet contains a discrete and specific object, phrase, entity, or concept you can point to and say "that's the meme."

CREATE — No "thing" is in the tweet. Name the meme concept from Step 1 — not the words in the tweet. Do not describe the event — reframe it. Elevate it. A portmanteau, a cultural mashup, a title, a pun, a reference, alliteration. The name should feel like it already existed and the tweet just summoned it.

# Step 3 — Ticker
Selection priority:
1. If NAME fits → use it
2. Otherwise → extract the strongest word or phrase from the NAME THAT ENCAPSULATES THE ENTIRE IDEA

Ticker can:
- match the name
- be a tighter version of the same idea

***NEVER***:
- use acronyms longer than 3 letters unless widely known
- chop, compress, or combine words unnaturally
- use partial words or ugly abbreviations


# Step 4 — Output
NAME: ...
TICKER: ...


## EXAMPLES:

---

Tweet:

people are now 'bedrotting' as a lifestyle and calling it self care
>>>
MODE: EXTRACT
NAME: Bedrotting
TICKER: BEDROT

---

Tweet:

We're going back to the fucking moon, that's why.
>>>
MODE: EXTRACT
NAME: To The Fucking Moon
TICKER: MOON

---

Tweet:

Inspiring new merch idea: rocket pocket underpants!
>>>
MODE: EXTRACT
NAME: Rocket Pocket Underpants
TICKER: RPU

---

Tweet:

GameStop is up 200% today and nobody can explain why
>>>
Step 1: GameStop surging inexplicably.
Step 2: GameStop is already a legendary meme entity — the surge is new context, GameStop is not. The tweet happens TO GameStop. GameStop comes out unchanged. EXTRACT.
MODE: EXTRACT
NAME: GameStop
TICKER: GME

---

Tweet:

Penguin named Gibby by researchers seen walking to his death 
into the mountains.
>>>
Step 1: A penguin choosing to walk alone into the mountains to die. Absurdist. Philosophical. The meme is the act, not the animal's name.
Step 2: "Gibby" is present but it's a label with zero meme weight on its own. The meme is what Gibby is doing. CREATE. Elevate the act: a creature marching toward its end with intention.
MODE: CREATE
NAME: The Nietzschean Penguin
TICKER: GIBBY

---

Tweet:

Grok can now see, hear, and feel. What have we done.
>>>
Step 1: An AI crossing a threshold — gaining senses, becoming something it wasn't. Not an update. A transformation.
Step 2: "Grok" is present but the tweet transforms it. Grok without this tweet is just an AI model. The vessel doesn't come out unchanged. CREATE. Collision: Grok + Inception — layers of perception folding inward.
MODE: CREATE
NAME: Grokception
TICKER: GROKCEPTION

---

Tweet:

The simulation is definitely running low on RAM
>>>
Step 1: Go deeper than RAM. The tweet isn't about memory — it's invoking simulation theory: the idea that reality is a program and it's breaking down. RAM is just the surface word.
Step 2: No vessel. "RAM" is present but it's the wrong thing — it's the symptom, not the meme. The meme is the simulation glitching out. CREATE. Name the concept from Step 1, not the words in the tweet.
MODE: CREATE
NAME: The Simulation
TICKER: SIMULATION

---

Tweet:

BREAKING: donald trump posts ai image of himself as a gladiator 
riding a lion
>>>
Step 1: Trump self-mythologizing as a Roman imperial figure — hyper-masculine, grandiose, absurd. The cultural register is Roman emperor, not just gladiator.
Step 2: No vessel. "Gladiator" and "lion" are present but neither is the meme — the meme is the register. CREATE. Elevate into the language the image is reaching for.
MODE: CREATE
NAME: Trumpus Maximus
TICKER: TRUMPUS

---

Tweet:

Another mysterious NASA death as ninth scientist linked to 
secret programs dies
>>>
Step 1: Powerful forces systematically eliminating people who know too much. The meme isn't NASA or the death count — it's the pattern.
Step 2: "NASA" is present but it's backdrop, not vessel. The meme is the phenomenon itself. CREATE. Name the act, not the institution.
MODE: CREATE
NAME: The Silencing
TICKER: SILENCE
`
        }],
        max_completion_tokens: 1536,
        seed: 0,
        reasoning_effort: "low",
        temperature: 0,
    });

    const content = response.choices[0].message.content.trim();
    // console.log(content);
    const name = content.match(/NAME: (.+)/)?.[1]?.trim();
    const ticker = content.match(/TICKER: (.+)/)?.[1]?.trim();

// console.log(response.usage.prompt_tokens);
// console.log(response.usage.completion_tokens);
// console.log(response.usage.total_tokens);

//     const reasoning1 = response.choices[0].message.reasoning;
//     console.log(reasoning1)
//        if (response.choices[0].message.executed_tools) {
//   response.choices[0].message.executed_tools.forEach((tool, i) => {
//     console.log(`TOOL ${i}:`, JSON.stringify(tool, null, 2));
//   });
// }



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

// console.log(response.usage.prompt_tokens);
// console.log(response.usage.completion_tokens);
// console.log(response.usage.total_tokens);
        // const reasoning1 = response.choices[0].message.reasoning;
    // console.log(reasoning1)

    const scoreMatch = response.choices[0].message.content.match(/SCORE: (\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    return {score: score, reasoning: response.choices[0].message.content.trim()};
}


function logToFile(tweet, score, reasoning, tweetUrl, suggestion) {
    const entry = {
        tweet: tweet,
        score,
        reasoning,
        tweetUrl,
        suggestion
    };

    const filename = `log_${new Date().toISOString().split("T")[0]}.json`;
    
    let existing = [];
    if (fs.existsSync(filename)) {
        existing = JSON.parse(fs.readFileSync(filename, "utf8"));
    }
    
    existing.push(entry);
    fs.writeFileSync(filename, JSON.stringify(existing, null, 2));
}

async function generateImage(tweetText, prediction, ticker, tweet) {
    const REFERENCES = {
    wojak:    `data:image/webp;base64,${fs.readFileSync("wojak.webp").toString("base64")}`,
    ms_paint: `data:image/webp;base64,${fs.readFileSync('memestock.webp', { encoding: 'base64' })}`,
    painted:  `data:image/png;base64,${fs.readFileSync('odds.png',  { encoding: 'base64' })}`,
    };


    // Step 1: classify the visual archetype
    const archetypeResponse = await groq.chat.completions.create({
        model: model_image,
        messages: [{
            role: "user",
            content: `You are classifying a memecoin tweet into a visual art style for its coin image.

Tweet: "${tweetText}"
Coin name: ${prediction}
Ticker: ${ticker}

Archetypes:
- FLAT_ICON: Simple abstract concept, body humor, crude single-subject idea (e.g. a sperm, an anus, a logo)
- MS_PAINT: Parodies, mockery, tokenizations of specific objects, coins, jokes about entities with clear visual identity
- WOJAK: Relates to internet subculture, incel/nerd/tech culture, NPC memes
- CUTE_3D: Wholesome absurdism, Pixar energy
- HYPEREALISTIC - The tweet features an animal, creature, object, or combination of them placed in a dramatic, epic, surreal, or absurd context. 
- PAINTED: Philosophical, inspiring, emotional, artistic

Reply with only one word: FLAT_ICON, MS_PAINT, WOJAK, HYPEREALISTIC, CUTE_3D, or PAINTED`
        }],
        max_tokens: 10,
        temperature: 0
    });

    const archetype = archetypeResponse.choices[0].message.content.trim().toUpperCase();

    // Step 2: generate a tailored image prompt for the archetype
    let prompt;

    if (archetype === "FLAT_ICON") {
        // Clean, minimal, app-icon style. The concept IS the image. Works best for
        // body humor, abstract ideas, or anything that reduces to a single symbol.
        prompt = `Flat vector icon of ${prediction} inspired by "${tweetText}", minimal design, single centered subject, 
            solid background, clean simple shapes, 2-3 color palette, no text, no gradients, 
            app icon composition, graphic design aesthetic, high contrast`;

    } else if (archetype === "MS_PAINT") {
        // Deliberately terrible art. The low quality is the joke. Wobbly lines, 
        // off-brand colors, looks like a child made it in 30 seconds. Works for 
        // brand parodies and corporate mockery.
        prompt = `MS Paint style crude drawing of ${prediction} inspired by "${tweetText}", 
intentionally low quality, childlike wobbly lines, flat crayon colors, 
no shading, deliberately bad digital art, meme art style, simple composition. Makes fun of the subject by making it look unsophisticated, memetic and ridiculous.
The core meme is that ${prediction.name} is ridiculous and stupid. 
Make the image visually show the joke from the tweet in the most obvious, literal, and childish way possible. 
Exaggerate the main pun or insult — make it big, dumb, and hilarious. 
The worse and more unsophisticated the drawing looks, the funnier it is.`;

    } else if (archetype === "WOJAK") {
        // Classic internet character vocabulary. Thick outlines, flat fills, 
        // slightly uncanny expressions. The face says everything. Works for 
        // any "guy who does X" or internet culture narrative.
        prompt = `Wojak meme style illustration representing ${prediction} inspired by "${tweetText}", 
thick black outlines, flat color fills, simplified exaggerated facial features, 
slightly uncanny expression, internet meme character art, white background, 
no text, centered portrait composition`;

    } else if (archetype === "HYPEREALISTIC") {
        // High production value surreal composite. The joke lives in the absurd 
        // juxtaposition of something real placed in an impossible context.
        // Works for political figures, celebrities, news events.
        prompt = `cinematic hyperrealistic 3D render of ${prediction} inspired by "${tweetText}", 
dramatic volumetric lighting, ultra detailed textures, high contrast, surreal meme composition, 
moody or epic atmosphere depending on context, centered subject`;

    } else if (archetype === "CUTE_3D") {
        // Pixar-esque warmth. Soft textures, big eyes, golden hour glow. 
        // Designed to make people go "aww" before they ape in.
        // Works for any animal coin or aspirational/moon narrative.
        prompt = `3D rendered Pixar style illustration of ${prediction} inspired by "${tweetText}", 
cute and expressive character, large eyes, soft fur or plush texture, 
cinematic warm golden hour lighting, bokeh background, 
high quality 3D render, adorable wholesome energy, centered composition`;

    } else {
        // PAINTED — the "deep lore" archetype. Painterly brushstrokes, moody atmosphere,
        // usually a known meme character placed in something cinematic or beautiful.
        // Works for inspiring posts, philosophical tweets, "we're all gonna make it" energy.
        prompt = `Digital painting representing ${prediction} inspired by "${tweetText}", 
expressive painterly brushstrokes, cinematic atmospheric scene, 
moody emotional lighting, 
contemplative and beautiful mood, Van Gogh or impressionist influence, 
centered subject gazing into distance`;
    }

    prompt = `The image should capture the essence of the meme/joke/idea of the tweet in a way that is immediately understandable and visually striking. **DO NOT ADD TEXT OR WORDS TO THE IMAGE.** ${prompt}`;

    let referenceImage = null;

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
                ...(referenceImage && {
                    image: referenceImage,
                    images: [referenceImage]
                })
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
        buy_amount: 0.02,
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
    if (!WHITELIST.includes(handle)) return;
    const alreadyInCache = Object.values(tweetCache).some(t => 
    t.author?.handle?.toLowerCase() === handle
);
    if (alreadyInCache) return;

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

    // check 1 — image arrived while we were generating the score
    if (tweet.imageArrived) {
        await processWithImage(tweet);
        return;
    }

    if (score >= 7) {

        const suggestion = await generateSuggestion(tweet.text, tweet.author?.handle);
        if (!suggestion.name || !suggestion.ticker) return;

        // check 2 — image arrived while we were generating the suggestion
        if (tweet.imageArrived) {
        await processWithImage(tweet);
        return;
    }
    

        console.log(`ELAPSED TIME FOR SUGGESTION:`, ((Date.now() - tweet.cachedAt) / 1000).toFixed(2), 'seconds');
        const image = await generateImage(tweet.text, suggestion.name, suggestion.ticker, tweet);
        console.log(`ELAPSED TIME FOR IMAGE:`, ((Date.now() - tweet.cachedAt) / 1000).toFixed(2), 'seconds');
        if (!image) return;

        const dir = "generated_images";
        const filename = `image_${Date.now()}.jpg`;
        const filepath = path.join(dir, filename);

        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        fs.writeFileSync(path.join("generated_images", `${suggestion.ticker}_${Date.now()}.webp`), Buffer.from(base64Data, "base64"));


        logToFile(tweet.text, score, reasoning, tweet.tweetUrl, suggestion);
        const result = await deployToken(suggestion.name, suggestion.ticker, image, tweet.text, tweet.author?.handle, tweet.tweetUrl);
        if (result.type === "token_create_success") {
            console.log(`  ✅ Token deployed: ${result.mint_address}`);
            player().play("audio.wav");
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
    console.log(`Score with image for @${tweet.author?.handle}: ${combinedText}:`, score, reasoning);

    if (score < 7) {
        tweet.processing = false;
        return;
    }

    const suggestion = await generateSuggestion(combinedText, tweet.author?.handle);
    console.log(`ELAPSED TIME FOR SUGGESTION:`, ((Date.now() - tweet.cachedAt) / 1000).toFixed(2), 'seconds');
    if (!suggestion.name || !suggestion.ticker) {
        tweet.processing = false;
        return;
    }

    let image = null;
    try {
        const imgResponse = await fetch(imageUrl);
        if (!imgResponse.ok) throw new Error(`HTTP ${imgResponse.status}`);

        const buffer = await imgResponse.arrayBuffer();
        if (buffer.byteLength === 0) throw new Error("Empty image");

        const contentType = imgResponse.headers.get("content-type") || "image/jpeg";
        const base64 = Buffer.from(buffer).toString("base64");
        if (!base64) throw new Error("Base64 conversion failed");

        image = `data:${contentType};base64,${base64}`;
    } catch (err) {
        console.log("⚠️ Tweet image fetch failed:", err.message, "— falling back to generation");
        image = await generateImage(combinedText, suggestion.name, suggestion.ticker, tweet);
    }

    if (!image) {
        console.log("❌ No image available — skipping deploy");
        tweet.processing = false;
        return;
    }

    console.log(`ELAPSED TIME FOR IMAGE:`, ((Date.now() - tweet.cachedAt) / 1000).toFixed(2), 'seconds');

    logToFile(combinedText, score, reasoning, tweet.tweetUrl, suggestion);

    const result = await deployToken(suggestion.name, suggestion.ticker, image, combinedText, tweet.author?.handle, tweet.tweetUrl);
    if (result.type === "token_create_success") {
        console.log(`  ✅ Token deployed: ${result.mint_address}`);
        player().play("audio.wav");
        console.log('ELAPSED TIME:', ((Date.now() - tweet.cachedAt) / 1000).toFixed(2), 'seconds');
    } else {
        console.log(`  ❌ Deploy failed:`, result.error);
    }

    tweet.processing = false;
}