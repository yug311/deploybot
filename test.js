import dotenv from 'dotenv';
dotenv.config();
import { io } from "socket.io-client";
import fs from "fs";
import path from "path";
import Groq from "groq-sdk";
import { log } from 'console';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const model = "openai/gpt-oss-120b"; // "llama-3.3-70b-versatile", moonshotai/kimi-k2-instruct, qwen/qwen3-32b, openai/gpt-oss-120b 8b llama as well moonshotai/kimi-k2-instruct-0905

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


// console.log(await generateSuggestion("this golden retriever waited outside the same hospital every day until its owner came out after 3 months", "pubity"))
async function generateSuggestion(tweetText, author) {

    const response = await groq.chat.completions.create({
        model: model,
        messages: [{
            role: "user",
            content: `
SYSTEM ROLE
You are a memecoin naming engine for the Solana ecosystem. Your only job is to output a NAME and TICKER. Nothing else.

WHAT IS A MEMECOIN
A memecoin is pure attention. It is anything that makes someone stop mid-scroll because it is not average — a double take, a reaction, a "wait, what." It does not have to be funny. 
It does not have to be crypto. It just has to be the kind of thing people react to, talk about, or send to someone without thinking twice. Most will live in internet culture, crypto degeneracy, and viral moments — but the only real requirement is that it peaks interest in some way. If it would trend, it can be a memecoin.

The audience is crypto people who live online and understand internet culture. They get the slang, the memes, the references. Write for them.

STEP 1 — FIND THE MEME CORE
Before touching the name or ticker, identify the single sharpest thing about this tweet. Ask:

What is the joke, vibe, or act — not just the subject?
If someone is doing something embarrassing or funny → the meme is the act, not the person
If something is being described vividly → the description is the concept, not the thing being described
If it's an event → find the one word or phrase people will screenshot
If it's a person → only use the person if they are the meme. If something is being done to or about them, the meme may be the action

When a tweet has multiple angles, pick the single sharpest one and commit. Never blend two meme cores into one name.

STEP 2 — NAME
Max 32 characters. The punchiest distillation of the meme core.
The name does NOT have to use the words from the tweet. It can use:

Slang or internet phrasing
Exaggerated or dramatized versions to emit some type of feeling or emotion
Cultural references the audience will instantly recognize
Alliteration or rhythm if it makes the name more memorable

You may add words not in the tweet if they make the name more emotional, more punchable, or funnier. Sometimes prepend "The" when the concept is a clear archetype or object.
The legibility test: someone who hasn't read the tweet sees only the name — do they immediately get the meme?

STEP 3 — TICKER
Max 13 characters, all caps. Can include numbers, spaces, hyphens, or punctuation if it makes the ticker cleaner or more iconic.
Priority rules:

If the full name fits in 13 chars → use it exactly
If the name is one strong word → use that word
If the name is multi-word → keep the words with the most angle — the ones that are punchy and memeable on their own. Do NOT use initials/acronyms unless the acronym is max 3 characters and all words in the name carry equal meme weight
Never concatenate partial words. Shorten by dropping whole words, never chopping them
Keep numbers or symbols if they are part of the concept

The ticker does not have to be derived from the name. It can be a different facet of the same concept, a cultural reference, or a reframe that adds a second layer — as long as both name and ticker point at the same meme core.
Ticker quality check — before finalizing, ask:

Does it look good visually? Would traders spam it?
Does it work as a standalone exclamation? You should be able to shout it
Is it pronounceable as a word or an obvious chant? If it sounds like an abbreviation being spelled out, it's wrong
Does it avoid filler words? ("THE", "A", "OF" are dead weight)
Is it bold and standalone, not a fragment?

WHAT NOT TO DO
Wrong | Why
Blending two meme cores into one name | Dilutes the punch — one core, full commitment
Using initials as a 4+ letter acronym | NEET works because it's a real term; RBSF for "random boring stuff fails" does not
Chopping partial words in the ticker | Makes it illegible and weak

SPECIAL NAMING PATTERNS
Apply when relevant — not when approximate:

Tweet describing Donald Trump in a memetic way:

Presidential/policy tone → [Idea INITIAL]OTUS, ticker = [Idea] of The United States
Personal/irreverent tone → [Idea]nald, ticker = same

ANIMAL or HUMAN WITH SAD STORY: name = "Justice For [Name]", ticker = name only
ANIMAL or HUMAN WITH FUN STORY: name and ticker = the name
ANIMAL or HUMAN DIED: name = "RIP [Name]", ticker = name only
EMERGING TREND / NEW THING PEOPLE ARE DOING: name and ticker = [thing] + "ify"
TRADING / COINS / TOKENS (stock dumping, trading like memecoin, pumping, tokenizing): name and ticker = [thing] + "coin"
MOCKING SOMEONE / person did something stupid: misspell the person's name in a funny way — change vowels or consonants, keep it recognizable but intentionally wrong. Both name and ticker use the misspelled version. Only apply this when the person themselves is the joke — not when they did something interesting or noteworthy.

EXAMPLES:
Tweet: "We're going back to the fucking moon, that's why."
Name: To The Fucking Moon
Ticker: MOON

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
    
    return { name, ticker };
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
- Tokenization, trading, or calling something financially adjacent with a concrete idea that is not a normal concept.
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
        temperature: 0
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
    { author: "realdonaldtrump", text: "We are going to make America great again, stronger than ever before!" },
    { author: "elonmusk", text: "Biden is the most confused president in history lmao" },
    { author: "peta", text: "A golden retriever named Biscuit was found abandoned in the snow, but survived after walking 30 miles home" },
    { author: "bbcnews", text: "Beloved therapy dog Max passes away after 15 years of service at children's hospital" },
    { author: "popcrave", text: "People are using AI to turn their selfies into renaissance paintings and it's going viral" },
    { author: "unusual_whales", text: "Silver is trading like a memecoin today. Up 40% in 24 hours." },
    { author: "elonmusk", text: "Bernie Sanders wants to tax everything you own" },
    { author: "nypost", text: "Melania Trump caught on camera rolling her eyes at Biden during state dinner" },

    // MEME CORE DETECTION
    { author: "elonmusk", text: "The simulation is definitely running low on RAM" },
    { author: "naval", text: "Desire is a contract you make with yourself to be unhappy until you get what you want" },
    { author: "solana", text: "1 million transactions per second. No big deal." },
    { author: "elonmusk", text: "gm" },
    { author: "elonmusk", text: "we're so back" },
    { author: "realdonaldtrump", text: "WITCH HUNT. TOTAL HOAX. SAD!" },

    // CRYPTO/FINANCE
    { author: "unusual_whales", text: "GameStop is up 200% today and nobody can explain why" },
    { author: "saylor", text: "Bitcoin is the exit. Everything else is the burning building." },
    { author: "pumpfun", text: "1 billion tokens launched. The era of infinite memecoins has begun." },

    // ANIMALS
    { author: "bbcnews", text: "A duck in Paris has learned to say bonjour to tourists outside the Louvre" },
    { author: "nypost", text: "Florida man's pet alligator escapes and takes over neighborhood pool" },

    // TECH/AI
    { author: "sama", text: "we have achieved AGI internally. announcement coming soon." },
    { author: "elonmusk", text: "Grok can now see, hear, and feel. What have we done." },
    { author: "nvidia", text: "Introducing the GB200: 1000x faster than the human brain at math" },

    // ABSURD/VIRAL
    { author: "elonmusk", text: "I ate a live cockroach on a dare. It tasted like chicken." },
    { author: "popcrave", text: "A man in Japan has married his Roomba after 10 years of companionship" },
    { author: "nypost", text: "Woman shows up to her own funeral after family declared her dead by mistake" },

    // SHOULD SCORE LOW (bad tweets that might sneak through)
    { author: "solana", text: "Join us for our developer conference next week in San Francisco. Register now at solana.com/conf" },
    { author: "nvidia", text: "Our Q3 earnings exceeded expectations. Revenue up 12% YoY. Full report available at investor.nvidia.com" },

    {author: "dexerto", text: "guy live streamed himself quitting his job mid zoom call and accidentally shared his screen with his boss the whole time"},
    {author: "culturecrave", text: "elon musk shows up to meeting with a sink again and refuses to explain why"},
    {author: "pubity", text: "this golden retriever waited outside the same hospital every day until its owner came out after 3 months"},
    {author: "watcherguru", text: "BREAKING: traders are now buying coins based on dreams they had while sleeping"},
    {author: "nojumper", text: "man tried to jump over a moving car for tiktok and immediately got hit"},
    {author: "dexerto", text: "new trend where people are rating strangers aura levels in public is going viral"},
    {author: "barstoolsports", text: "kid brings entire rotisserie chicken in backpack to school and eats it during math class"},
    {author: "cnn", text: "scientists say they may have accidentally created a new color no human has ever seen before"},
    {author: "cointelegraph", text: "trader turned 200 dollars into 3 million then lost it all in 6 minutes on livestream"},
    {author: "bbcnews", text: "cat named biscuit somehow boarded a plane and flew to another country alone"},
    {author: "dexerto", text: "people are now pretending to be npcs in real life and only speaking when tipped"},
    {author: "ladbible", text: "guy spent 14 hours building ikea desk just to realize he built it upside down"},
    {author: "foxnews", text: "BREAKING: donald trump says he would 'absolutely win' a fight against a kangaroo"},
    {author: "buzzfeed", text: "girl goes viral for texting her ex 'you up' and accidentally sending it to her boss instead"},
    {author: "verge", text: "new ai tool lets you generate your future self and people are becoming obsessed with it"},
    {author: "goodnewsnetwork", text: "homeless man returns lost wallet with 10000 dollars inside untouched"},
    {author: "reddit", text: "guy confidently walks into wrong wedding and stays for 4 hours before realizing"},
    {author: "watcherguru", text: "BREAKING: gold just hit an all time high as markets panic"},
    {author: "twitch", text: "streamer falls asleep on live for 9 hours and chat refuses to leave"},
    {author: "insider", text: "woman names her pet rock steve and throws it a birthday party every year"},
    {author: "coindesk", text: "new crypto meta where people are launching coins based on random words is exploding"},
    {author: "dailyfail", text: "guy tries to impress date by ordering in french and accidentally insults the waiter"},
    {author: "theverge", text: "BREAKING: mark zuckerberg unveils hyper realistic ai clone that can replace you in meetings"},
    {author: "nhknews", text: "dog refuses to move from train station after owner passed away"},
    {author: "vice", text: "people are now 'bedrotting' as a lifestyle and calling it self care"},
    {author: "worldstar", text: "man gets stuck in revolving door for 10 minutes while everyone watches"},
    {author: "reuters", text: "BREAKING: government confirms they lost track of a high altitude balloon again"},
    {author: "foodbeast", text: "guy brings his own microwave to mcdonalds to reheat fries and gets kicked out"},
    {author: "watcherguru", text: "elon musk tweets 'hmm' and crypto markets instantly react"},
    {author: "dexerto", text: "new trend of people turning themselves into action figures using ai is going viral"},
    {author: "cnn", text: "BREAKING: donald trump posts ai image of himself as a gladiator riding a lion"},
    {author: "schoolmemes", text: "kid accidentally calls teacher mom and the entire class goes silent"},
    {author: "diyfails", text: "guy spends 3 years building boat in backyard and realizes it cant fit through gate"},
    {author: "bloomberg", text: "BREAKING: oil prices surge 50 percent overnight"},
    {author: "tiktok", text: "girl records herself quitting gym after one workout saying 'this isnt for me'"},
    {author: "dexerto", text: "new trend where people only communicate in emojis for entire day"},
    {author: "abcnews", text: "cat interrupts live news broadcast and steals the spotlight"},
    {author: "tmz", text: "man fakes knowing celebrity at party and gets introduced to them accidentally"},
    {author: "foxnews", text: "BREAKING: donald trump says he invented a new word during speech and refuses to define it"},
    {author: "ubereats", text: "guy orders 100 chicken nuggets at 3am and eats all of them alone"},
    {author: "reddit", text: "people are now rating their friends like video game characters with stats"},
    {author: "coindesk", text: "BREAKING: bitcoin crashes 30 percent in minutes wiping out billions"},
    {author: "localnews", text: "dog saves child from river and becomes local hero overnight"},
    {author: "awkwardcentral", text: "guy waves back at someone who wasnt waving at him and has to leave store"}

];

async function runTests() {
    for (const test of testTweets) {
        const { name, ticker } = await generateSuggestion(test.text, test.author);
        console.log(`\n📝 @${test.author}: "${test.text}"`);
        console.log(`   NAME: ${name}`);
        console.log(`   TICKER: ${ticker}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

runTests();