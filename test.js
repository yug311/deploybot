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

const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const cerebras = new Cerebras({ apiKey: process.env.CEREBRAS_API_KEY });
const together = new Together({ apiKey: process.env.TOGETHERAI_API_KEY  });


const model = "qwen/qwen3-32b";
// qwen/qwen3-32b
// meta-llama/llama-4-scout-17b-16e-instruct
// openai/gpt-oss-20b
// canopylabs/orpheus-v1-english
// canopylabs/orpheus-arabic-saudi
// llama-3.3-70b-versatile
// groq/compound
// openai/gpt-oss-safeguard-20b
// whisper-large-v3
// llama-3.1-8b-instant
// groq/compound-mini
// whisper-large-v3-turbo
// openai/gpt-oss-120b
// allam-2-7b
// meta-llama/llama-prompt-guard-2-86m
// meta-llama/llama-prompt-guard-2-22m

// {"object":"list","data":[{"id":"qwen-3-235b-a22b-instruct-2507","object":"model","created":0,"owned_by":"Cerebras"},{"id":"zai-glm-4.7","object":"model","created":0,"owned_by":"Cerebras"},{"id":"gpt-oss-120b","object":"model","created":0,"owned_by":"Cerebras"},{"id":"llama3.1-8b","object":"model","created":0,"owned_by":"Cerebras"}]}%             
const WHITELIST = [
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
    "nytimes", "wsj", "Reuters", "ap", "bbcbreaking", "cnnbrk", "theeconomist",
    "FinancialTimes", "bloomberg", "cnbc", "forbes", "marketwatch",
    "BloombergTV", "cnbc", "abcnews", "cbsnews", "nbcnews", "time",
    "usnews", "dailymail", "popcrave", "breakingbadenews",
    "collinrugg", "zerohedge", "wsbchairman", "wallstreetbets", "markets",
    "dexerto", "xdaily", "polymarket", "autismcapital", "libsoftiktok",
    "theeconomist", "thehill", "theonion", "thewrap", "tradingview", "tmz", "usatoday", "variety", "verge", "vice", "washingtonpost", "wired", "wsjmarkets", "yahoofinance", "ynewswire",
    "bbcnews", "aljazeera", "ap", "axios", "bbcnews", "bbcworld", "bleacherreport", "business", "businessinsider", "buzzfeed", "cbsnews", "cnn", "dailymail", "deltaone", "dexerto", "economist", "espn", "financialtimes", "fortunemagazine", "foxnews", "guardian", "hollywoodreporter", "investingcom", "latimes", "markets", "nbcnews", "newsweek", "npr", "politico", "rollingstone", "skynews", "stocktwits", "techcrunch", "theatlantic", "thebabylonbee", "theeconomist", "thehill", "theonion", "thewrap", "time", "tradingview", "tmz", "usatoday", "variety", "verge", "vice", "washingtonpost", "wired",

    // meme / viral / culture accounts
    "nasa", "doge", "shibainu", "pepecoin", "doge_wif_hat",
    "nikitabier", "joincolosseum", "tyler", "garyvee", "beeple",
    "pranksy", "cozomomedici", "frankdegods", "shib", "natgeo",

    //companies
    "adidas", "amazon", "amd", "anthropicai", "apple", "canva", "cocacola", "disney", "doritos", "gemini", "google", "gymshark", "hellofresh",
    "tesla", "hp", "hulu", "intel", "ikea", "kfc", "lego", "mcdonalds", "microsoft", "nike", "netflix", "nvidia", "openai", "pepsi", "playstation",
    "redbull", "samsung", "spotify", "spacex", "subway", "ubereats", "xbox", "nvidia"
];

// const WOJAK_IMAGE = `data:image/webp;base64,${fs.readFileSync("wojak.webp").toString("base64")}`;
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
        model: model,
        messages: [{
            role: "user",
            content: `

You will receive a memetic tweet and its author. The tweet will contain some type of phrase/meme/viral concept of the following types:

- A real joke, meme format, or punchline — something with a setup and a payoff
- A cultural moment, viral concept, or internet phenomenon with staying power; it could trend
- A specific, vivid, memeable idea that can become a cartoon, character, or coin identity
- Animals with a story (cute, funny, sad, heroic)
- Genuinely interesting or groundbreaking tech/AI/crypto news where the concept itself is the hook
- Slang or internet culture used in a meaningful, specific way — not just dropped randomly
- Political content with an actual angle, joke, or specific absurdity — not just a name drop
- Financial nihilism, crypto culture, or degen energy attached to a real concept
- Tokenization, trading, or calling something financially adjacent with a concrete idea. Something that crypto memecoin traders can relate to.
- Anything that makes you stop and react — not just nod and scroll
- An image that adds a specific visual hook — a funny reaction, an absurd moment caught on camera, a striking visual concept, or a product/announcement so significant it has cultural weight on its own

Tokenize the tweet into a memecoin.
The audience is crypto-native people who live online. They know the slang, the memes, the references. Write for them.

PRIORITY ORDER (STRICT):

1. Correct meme object
2. Faithfulness to object (no invention)
3. Clean NAME representation
4. Clean TICKER
5. Creativity / style

STEP 1:

First identify the singular phrase/entity/concept that stands out in the tweet.
The meme object is the main subject people would reference when talking about the tweet.
Prefer the term that already exists as a recognizable idea or phrase, not a subcomponent of it.
If removing a word still leaves the main entity intact, it is NOT apart of meme object.

It will be:
- A single atomic entity, phrase, idea, name, or concept
- The main subject of a joke or statement, not a component, symptom, or internal resource of it.

It is NOT:
- Anything related to the core idea that is not the core idea itself
- A description of an kind

The meme object must collapse to ONE canonical label.

If multiple elements seem important, you MUST choose ONE and discard the rest or find a real word/phrase/expression that captures its entirety.

If multiple candidates exist, choose using this priority:

1. Existing known phrase or meme
2. Proper noun / named entity
3. Single vivid noun
4. Only if none exist → a short phrase (max 2 words)

Do NOT combine multiple elements into a single name.
Do NOT describe the situation.
Do NOT include both an object and its condition/state.

STEP 2:

Now output a NAME and TICKER that represent ONLY that object.
Patterns are applied AFTER the meme object is selected. They must not influence which object is chosen.
If a pattern does not fit naturally, DO NOT force it. Default to CORE WORD.

There are only three valid relationships between NAME and TICKER:

- CORE WORD (This is the deault)
Ticker is the exact meme object/entity/concept. 
Name may ONLY rephrase or stylize the object itself.
It must NOT include surrounding context, causes, or conditions.
If the name contains more information than the object alone, it is wrong.

- SPLIT CONCEPT
Ticker = exact meme object
Name = same object with light stylistic framing ONLY (e.g. adding “The”, slang, or tone)
The name must still clearly refer to the SAME object, not the full situation
- ACRONYM PAIR (Only when meme object is 3 distinct words long or is a well established acronym)

Ticker is the acronym
Name is the full phrase of that same object.

Do NOT mix patterns. Do not add words to fit patterns.

RULES:

- NAME max 32 characters; it should only represent the main meme object in a punchy or creative way
- TICKER max 13 characters, all caps

Ticker must be:

- readable
- natural
- real word, phrase, or known acronym

AVOID:
- Making the ticker compressed unnaturally (do not remove letters from words or splice parts of words or letters unless a clear 3 letter or well known acronym)
- Never truncate or partially remove letters from a word.
- Ticker quality must NEVER influence meme object selection. If the correct object leads to an awkward ticker, keep the object and simplify the ticker later.

Prefer:
- the raw meme object
- or a clean acronym of it
- or a widely recognized term

If unsure:
- use the single strongest noun in the tweet
- or the existing viral phrase exactly as-is

You are encouraged to be creative, degenerate, memetic, and joking only in formatting the coins name and ticker, not in changing the underlying object.
Make them the punchiest distillation of the meme core. It does not have to use the exact words from the tweet.
This includes:
- crypto style naming (coining, referring to recognized meme formats)
- slang or internet phrasing
- cultural references the audience instantly recognizes
- rhythm or alliteration if it improves memorability

HERE ARE SOME EXAMPLES:
Tweet: "We're going back to the fucking moon, that's why."
Name: To The Fucking Moon
Ticker: MOON

Tweet: "Penguin named Gibby by researchers seen walking to his death into the mountains."
Name: The Nietzchean Penguin
Ticker: Gibby

Tweet: "Another mysterious NASA death as ninth scientist linked to secret programs dies"
Name: The Silencing
Ticker: SILENCING

Tweet: "Seven stolen dogs go viral after escaping and making 17km journey home"
Name: The Wandering 7
Ticker: 7

Tweet: "BREAKING: NVIDIA CEO announces 'we've achieved AGI'"
Name: Artificial General Intelligence
Ticker: AGI

Tweet: "Berne Sanders caught on camera stealing a slice of pizza from a kid at a campaign event"
Name: Burnie Sunders
Ticker: Burnie

Tweet: "Floating Nutella Jar in Space just going viral"
Name: Flying Nutella Jar
Ticker: FNJ

Tweet: "People using openai ghibli tool to turn images into ghibli style is becoming a viral trend right now."
Name: ghiblify
Ticker: GHIBlLiFY        

Tweet: "LDAR is a term used to describe someone who is doing nothing with their life, laying down and rotting"
Name: Lay Down And Rot
Ticker: LDAR

Tweet: "Meta builds AI version of Mark Zuckerberg to interact with staff"
Name: Zuckbot
Ticker: ZUCKBOT

Tweet: "HOLY FUCK Japan created Oil from Water and CO2. They called it e-fuel"
Name: E-Fuel
Ticker: E-FUEL

Tweet: "Optimistic Minion. The newest viral reaction image."
Name: Optimistic Minion
Ticker: OPTIMISTIC

Tweet: "Conan O'Brien and Leonardo DiCaprio present an idea for a new Leo meme at the Oscars: TFW you didn't agree with this"
Name: You Didn't Agree To This
Ticker: TFW

Tweet: "yes low conviction, lettuce 🥬 hands"
Name: Lettuce Hands
Ticker: LETTUCE

Tweet: "Gold is surging 70%"
Name: Goldcoin
Ticker: GOLDCOIN          

Tweet: "An Iranian girl plays on swings at a beach as smoke rises from airstrikes in the background"
Name: The Last Swing
Ticker: SWING

Tweet: "After attacking Pope Leo XIV, President Trump posted an AI image to TruthSocial portraying himself as Jesus Christ"
Name: Donald Jesus Trump
Ticker: DJT

Tweet: "JUST IN: Colombia plans to euthanize dozens of Pablo Escobar's “cocaine hippos” to control their population."
Name: Justice for Cocaine Hippos
Ticker: COCAINE HIPPO

Tweet: "Inspiring new merch idea: rocket pocket underpants!"
Name: Rocket Pocket Underpants
Ticker: RPU

Tweet: "Animal rights activist 'freed' restaurant's lobster after falsely believing it was to be eaten."
Name: The Liberated Lobster
Ticker: LOBSTER

Tweet: "The people cry out for retardmaxxing."
Name: Retardmaxxing
Ticker: RETARDMAXXING

Tweet: "I think when we removed the crypto bots, there were only 2000 people rugging each other back and forth, forever"
Name: The Last 2000
Ticker: 2000

Tweet: "Trump might be the most stupid and retarded president I've ever seen."
Name: Retardnald
Ticker: RETARDNALD


INPUT
Author: @${author}
Tweet: "${tweetText}"

OUTPUT FORMAT — nothing else, no explanation, no commentary:
NAME: [token name]
TICKER: [ticker]
`
        }],
        max_tokens: 1000,
        temperature: 0
    });

    const content = response.choices[0].message.content.trim();
    const name = content.match(/NAME: (.+)/)?.[1]?.trim();
    const ticker = content.match(/TICKER: (.+)/)?.[1]?.trim();
    const reasoning = content.match(/REASONING: (.+)/)?.[1]?.trim();

    return { name, ticker, reasoning };
}

// console.log(await scoreTweet("Enjoy. \n\nCredit to @dinkin_flickaa for designing and shipping", "nikitabier"));
async function scoreTweet(tweetText, authorsHandle) {
    const response = await groq.chat.completions.create({
        model: model,
        messages: [{
            role: "user",
            content: `You are an expert in crypto memecoin culture on Solana and crypto Twitter. You understand what makes a good memecoin on pump.fun. Remember, memecoins are based on anything that can grab a person's attention. It could be a joke, a vibe, an absurdity, a cultural moment, a viral concept, a specific image or character in the tweet, or even just the energy of the tweet distilled into a single idea. The best memecoins have a clear and specific meme core that can be easily understood and visualized.

Rate this tweet's memecoin potential 1-10. Reply with the score first, then one short sentence explaining why.

These tweets come from major influencers so the author already has pull.

BEFORE SCORING — ask yourself: does this tweet contain an actual meme, joke, concept, or moment? Not just energy, not just slang, not just a famous name. Something that could become a coin with an identity. If the answer is no, the score is low regardless of everything else.

*NOTE*: Not all tweets have images. If no image description or it says "No Description", base on text alone.

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
- Anything that makes you stop and react — not just nod and scroll
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


Tweet: ${tweetText}
Twitter/X handle: ${authorsHandle}`
        }],
        max_tokens: 10,
        temperature: 1
    });

    // const score = parseInt(response.choices[0].message.content.trim());
    // return score;

    const scoreMatch = response.choices[0].message.content.match(/\d+/);
    const score = scoreMatch ? parseInt(scoreMatch[0]) : 0;
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
        model: model,
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

    prompt += `. No text or words. The image should capture the essence of the meme/joke/idea of the tweet in a way that is immediately understandable and visually striking. `;

    // Step 3: only archetypes where style is hard to communicate via text alone get a reference.
    // CUTE_3D and PHOTOREALISTIC are excluded — models nail these from text.
    // FLAT_ICON is borderline but usually fine without one.
    // let referenceImage = archetype === "WOJAK"    ? REFERENCES.wojak
    //                     : archetype === "MS_PAINT"  ? REFERENCES.ms_paint
    //                     : archetype === "PAINTED"   ? REFERENCES.painted
    //                     : null;
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

// const name = "iron dome for cats"
// const ticker = "ironcat";
// const tweetText = `iron dome for cats .`;
// generateImage(tweetText, name, ticker, null)

async function deployToken(name, ticker, imageBase64, tweetText, authorHandle, tweetUrl) {
    const AI_TERMS = [
        "ai", "gpt", "claude", "llama", "gemini", "singularity", "sentient",
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

    console.log(imageBase64);
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
            "Content-Type": "application/json",
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
    // const handle = data.author?.handle?.toLowerCase();
    // if (!WHITELIST.includes(handle)) return;

    // tweetCache[data.id] = {
    //     ...data,
    //     cachedAt: Date.now(),
    //     processing: false,
    //     imageArrived: false,
    //     hasMedia: data.media?.images?.length > 0
    // };

    // processTweet(data.id);
});

socket.on("tweet_update", (data) => {
    // const existing = tweetCache[data.id];
    // if (!existing) return;

    // const hasMedia = data.media?.images?.length > 0;

    // tweetCache[data.id] = {
    //     ...data,
    //     cachedAt: existing.cachedAt,
    //     processing: existing.processing,
    //     imageArrived: existing.imageArrived || hasMedia,
    //     hasMedia: existing.hasMedia || hasMedia,
    //     abortController: existing.abortController
    // };

    // if (hasMedia && !existing.hasMedia) {        
    //     if (existing.processing) {
    //         existing.abortController?.abort();
    //         processWithImage(tweetCache[data.id]);
    //     }
    // }
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
    
        const image = await generateImage(tweet.text, suggestion.name, suggestion.ticker, tweet);
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
            console.log('ELAPSED TIME:', ((Date.now() - tweet.cachedAt) / 1000).toFixed(2), 'seconds');
        } else {
            console.log(`  ❌ Deploy failed:`, result.error);
        }
    }

    tweet.processing = false;
}


async function processWithImage(tweet) {
    const imageUrl = tweet.media.images[0].url;
    console.log(imageUrl);

    let imageDescription = "No description";
    try {
        const visionResponse = await groq.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [{
                role: "user",
                content: [
                    {
                        type: "image_url",
                        image_url: { url: imageUrl }
                    },
                    {
                        type: "text",
                        text: `Describe what you see in this image in one short sentence. Focus on the main subject, mood, and any text visible. Be concise but make sure to pick up on important details.`
                    }
                ]
            }],
            max_tokens: 100,
            temperature: 0
        });

        imageDescription = visionResponse.choices[0].message.content.trim();
    } catch (err) {
        console.log("❌ Image description failed:", err.message, "— falling back to text only");
    }
    console.log(imageDescription);
    const combinedText = `${tweet.text || ""} [image: ${imageDescription}]`.trim();

    const { score, reasoning } = await scoreTweet(combinedText, tweet.author?.handle);

    if (score < 7) {
        tweet.processing = false;
        return;
    }

    const suggestion = await generateSuggestion(combinedText, tweet.author?.handle);
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
        console.log("✅ Tweet image fetched successfully");
    } catch (err) {
        console.log("⚠️ Tweet image fetch failed:", err.message, "— falling back to generation");
        image = await generateImage(combinedText, suggestion.name, suggestion.ticker, tweet);
    }

    if (!image) {
        console.log("❌ No image available — skipping deploy");
        tweet.processing = false;
        return;
    }

    logToFile(combinedText, score, reasoning, tweet.tweetUrl, suggestion);

    const result = await deployToken(suggestion.name, suggestion.ticker, image, combinedText, tweet.author?.handle, tweet.tweetUrl);
    if (result.type === "token_create_success") {
        console.log(`  ✅ Token deployed: ${result.mint_address}`);
        console.log('ELAPSED TIME:', ((Date.now() - tweet.cachedAt) / 1000).toFixed(2), 'seconds');
    } else {
        console.log(`  ❌ Deploy failed:`, result.error);
    }

    tweet.processing = false;
}





















const testTweets = [
        {author: "cnn", text: "BREAKING: donald trump posts ai image of himself as a gladiator riding a lion"},

        { author: "elonmusk", text: "The simulation is definitely running low on RAM" },
            { author: "elonmusk", text: "Grok can now see, hear, and feel. What have we done." },
    {author: "culturecrave", text: "elon musk shows up to meeting with a sink again and refuses to explain why"},
    {author: "vice", text: "people are now 'bedrotting' as a lifestyle and calling it self care"},
    { author: "unusual_whales", text: "Silver is trading like a memecoin today. Up 40% in 24 hours." },
    {author: "wired", text: "It is official. $BRR is going to be the first publicly traded agentic finance firm. The deal will close in early April and then we will begin talking about our AI model and agent lab focused on finance. The team is working hard and we are excited to start sharing more."},
    {author: "globeandmail", text: "Relaxation of U.S. day-trading rules opens door to YOLO trading, higher risk  "},
        { author: "nypost", text: "Melania Trump caught on camera rolling her eyes at Biden during state dinner" },
            { author: "sama", text: "we have achieved AGI internally. announcement coming soon." },
            { author: "elonmusk", text: "we're so back" },
                { author: "unusual_whales", text: "GameStop is up 200% today and nobody can explain why" },
    {author: "watcherguru", text: "BREAKING: traders are now buying coins based on dreams they had while sleeping"},
    {author: "insider", text: "woman names her pet rock steve and throws it a birthday party every year"},





    // { author: "elonmusk", text: "Biden is the most confused president in history lmao" },
    // { author: "peta", text: "A golden retriever named Biscuit was found abandoned in the snow, but survived after walking 30 miles home" },
    // { author: "bbcnews", text: "Beloved therapy dog Max passes away after 15 years of service at children's hospital" },

    // // MEME CORE DETECTION

    // // CRYPTO/FINANCE
    // { author: "pumpfun", text: "1 billion tokens launched. The era of infinite memecoins has begun." },

    // // TECH/AI
    // { author: "nvidia", text: "Introducing the GB200: 1000x faster than the human brain at math" },

    // // ABSURD/VIRAL
    // { author: "elonmusk", text: "I ate a live cockroach on a dare. It tasted like chicken." },

    // {author: "dexerto", text: "new trend where people are rating strangers aura levels in public is going viral"},
    // {author: "bbcnews", text: "cat named biscuit somehow boarded a plane and flew to another country alone"},
    // {author: "dexerto", text: "people are now pretending to be npcs in real life and only speaking when tipped"},
    // {author: "foxnews", text: "BREAKING: donald trump says he would 'absolutely win' a fight against a kangaroo"},
    // {author: "verge", text: "new ai tool lets you generate your future self and people are becoming obsessed with it"},
    // {author: "watcherguru", text: "BREAKING: gold just hit an all time high as markets panic"},
    // {author: "coindesk", text: "new crypto meta where people are launching coins based on random words is exploding"},
    // {author: "theverge", text: "BREAKING: mark zuckerberg unveils hyper realistic ai clone that can replace you in meetings"},
    // {author: "nhknews", text: "dog refuses to move from train station after owner passed away"},
    // {author: "reuters", text: "BREAKING: government confirms they lost track of a high altitude balloon again"},
    // {author: "watcherguru", text: "elon musk tweets 'hmm' and crypto markets instantly react"},
    // {author: "bloomberg", text: "BREAKING: oil prices surge 50 percent overnight"},
    // {author: "dexerto", text: "new trend where people only communicate in emojis for entire day"},
    // {author: "coindesk", text: "BREAKING: bitcoin crashes 30 percent in minutes wiping out billions"},

];

async function runTests() {
    for (const test of testTweets) {
        const { name, ticker} = await generateSuggestion(test.text, test.author);
        console.log(`\n📝 @${test.author}: "${test.text}"`);
        console.log(`   NAME: ${name}`);
        console.log(`   TICKER: ${ticker}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

runTests();