import dotenv from 'dotenv';
dotenv.config();
import { io } from "socket.io-client";
import fs from "fs";
import Groq from "groq-sdk";
import { log } from 'console';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const model = "moonshotai/kimi-k2-instruct-0905"; // "llama-3.3-70b-versatile", moonshotai/kimi-k2-instruct, qwen/qwen3-32b, openai/gpt-oss-120b 8b llama as well moonshotai/kimi-k2-instruct-0905

const WHITELIST = [
    // crypto founders / builders / influencers
    "elonmusk", "pmarca", "toly", "aeyakovenko", "rajgokal", "armaniferrante",
    "naval", "saylor", "vitalikbuterin", "cz_binance", "balajis",
    "punk6529", "cobie", "hsaka", "inversebrah", "blknoiz06", "gainzy222",
    "notthreadguy", "muradmahmudov", "ansemthegoat", "weremeow", "dingalingts",
    "ethanberliner", "dogedesigner", "kaito_intern", "a1lon9",
    "brian_armstrong", "APompliano", "CryptoHayes", "100trillionUSD", "lopp",
    "MartyBent", "DocumentingBTC", "nic__carter", "zachxbt", "farokh",
    "SolBigBrain", "jessepollak", "LucaNetz", "CryptoCobain", "DonAlt",
    "justinsuntron", "cryptosmerkis", "ErikVoorhees", "cdixon", "PlanB",
    "WillClemente", "rektcapital", "CryptoTony__", "IncomeSharks", "BillyM2k", "CryptoCred", "SmartContracter", "SBF_FTX", "GaryGensler",

    // crypto platforms / projects / exchanges
    "pumpfun", "solana", "dogecoin", "ethereum", "coinbase", "binance",
    "raydiumprotocol", "jupiterexchange", "phantomwallet", "metadao",
    "cryptocom", "opensea", "rarible",

    // crypto news & on-chain signals (HEAVY EXPANSION)
    "CoinDesk", "Cointelegraph", "TheBlock__", "whale_alert", "WatcherGuru",
    "AltcoinDaily", "CoinMarketCap", "solana_daily", "CryptoPanicCom",
    "DecryptMedia", "Blockworks_", "BanklessHQ", "unusual_whales",
    "BloombergCrypto", "CNBCFastMoney", "SquawkCNBC",
    "BitcoinMagazine", "UTodayCrypto", "CoinGape", "BeInCrypto",
    "CryptoNews", "TheDefiant", "CryptoSlate", "ForkastNews",
    "BTC_Archive", "MMCrypto", "CryptoWendyO",

    // tech / AI CEOs / founders / researchers + tech news
    "sama", "gdb", "anthropy", "anthropicai", "openai", "jack",
    "sundarpichai", "satyanadella", "tim_cook", "jeffbezos", "billgates",
    "nvidia", "intelnews", "amd", "paulg", "ycombinator", "garrytan",
    "karpathy", "ilyasut", "emollick", "levelsio", "piratewires",
    "ID_AA_Carmack", "lexfridman", "kaifulee", "demishassabis", "gdbrockman",
    "AravSrinivas",
    "TechCrunch", "TheVerge", "WIRED", "Techmeme", "arstechnica",

    // politics / commentary
    "realdonaldtrump", "potus", "whitehouse", "vivekgramaswamy",
    "rorysutherland", "mtaibbi", "bariweiss", "joerogan",

    // general / mainstream news & breaking (HEAVY EXPANSION)
    "nytimes", "WSJ", "Reuters", "AP", "BBCBreaking", "cnnbrk", "TheEconomist",
    "FinancialTimes", "bloomberg", "cnbc", "forbes", "MarketWatch",
    "BloombergTV", "CNBC", "ABCNews", "CBSNews", "NBCNews", "TIME",
    "usnews", "dailymail", "popcrave", "breakingbadenews",
    "collinrugg", "zerohedge", "wsbchairman", "wallstreetbets", "markets",
    "dexerto", "xDaily", "polymarket", "autismcapital", "libsoftiktok",

    // finance / markets / investment news & voices (EXPANDED)
    "LizAnnSonders", "morganhousel", "BrianFeroldi", "awealthofcs",
    "ritholtz", "fluentinfinance", "bespokeinvest",
    "MarketWatch", "YahooFinance", "SeekingAlpha", "Investingcom",
    "SquawkCNBC", "FastMoney", "jimcramer",

    // meme / viral / culture accounts
    "nasa", "doge", "shibainu", "pepecoin", "doge_wif_hat",
    "nikitabier", "joincolosseum", "tyler", "garyvee", "beeple",
    "pranksy", "cozomomedici", "frankdegods", "shib",
];

const WOJAK_IMAGE = `data:image/webp;base64,${fs.readFileSync("wojak.webp").toString("base64")}`;
const PERSON_IMAGE = `data:image/webp;base64,${fs.readFileSync("carciature.webp").toString("base64")}`;
const ITEM_IMAGE = `data:image/webp;base64,${fs.readFileSync("memestock.webp").toString("base64")}`;

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
            content: `You are a crypto memecoin expert on Solana. Based on this tweet, suggest a memecoin name and ticker. Remember, memecoins are based on anything that can grab a person's attention. It could be a joke, a vibe, an absurdity, a cultural moment, a viral concept, a specific image or character in the tweet, or even just the energy of the tweet distilled into a single idea. The best memecoins have a clear and specific meme core that can be easily understood and visualized.

            STEP 1 — FIND THE MEME CORE:
            Before naming anything, identify what makes this tweet funny, viral, or memeable. Ask: what is the *joke*, *vibe*, or *action* — not just the subject?
            - If someone is doing something embarrassing or funny, the meme is the ACT, not the person
            - If something is being described vividly, the description IS the concept — not the object being described
            - If it's an event, find the single most iconic word or phrase — the one people will screenshot
            - If it's a person, only use the person if they ARE the meme. If something is being done to or by them, the meme may be the action

            STEP 2 — NAME:
            Max 32 characters. Correct capitalization. The punchiest distillation of the meme core — not a summary. Sometimes prepend "The" when the concept is a stand-out archetype or object.
            The name does NOT have to use the exact words from the tweet. Creativity, play on words, and cultural references are encouraged if they sharpen the concept.

            STEP 3 — TICKER:
            Max 13 characters, all caps. Can include spaces, numbers, and punctuation if it makes the ticker look cleaner or more iconic.

            Ticker priority:
            (1) If the full name fits in 13 chars, use it exactly
            (2) If the name is one strong word, use that word
            (3) If the name is multi-word, keep the words with the most ANGLE — memeable, punchy, funny on their own. Do NOT use initials/acronyms unless the acronym is max 3 characters and all words in the name are equally important to the meme
            (4) Never concatenate partial words or letters. Shorten by dropping whole words, never by chopping them
            (5) Keep numbers or symbols if they are part of the concept

            The ticker does not have to be derived directly from the name. It can be a different facet of the same concept, a cultural reference the audience will instantly recognize, or a reframe that adds a second layer of meaning — as long as both name and ticker point at the same core idea.

            SPECIAL NAMING PATTERNS — apply when relevant:
            - PRESIDENT/POLITICAL LEADER: ticker = [FIRST LETTER]OTUS, name = full acronym spelled out
            - TRUMP AS ADJECTIVE — choose based on tone:
                - Presidential/policy tone → [ADJECTIVE INITIAL]OTUS
                - Personal/irreverent tone → [ADJECTIVE]nald, ticker = same
            - ANIMAL or HUMAN WITH SAD STORY: name = "Justice For [Name]", ticker = name only
            - ANIMAL DIED: name = "RIP [Name]", ticker = name only
            - ANIMAL or HUMAN WITH FUN STORY: name and ticker = the name
            - EMERGING TREND/NEW THING PEOPLE ARE DOING: name and ticker = [thing] + "ify"
            - TRADING/COINS/TOKENS (stock dumping, trading like memecoin, pumping, tokenizing an asset): name and ticker = [thing] + "coin"
            - MOCKING SOMEONE/Someone did something stupid: misspell the person's name in a funny way — change vowels or consonants, keep it recognizable but intentionally wrong. Both name and ticker use the misspelled version.

            EXAMPLES:
            Tweet: "We're going back to the fucking moon, that's why."
            Name: To The Fucking Moon
            Ticker: MOON

            Tweet: "New Mexico Dog Diagnosed with Life-Threatening Plague, Marking the State's First Animal Case of 2026"
            Name: The Plague Dog
            Ticker: PEDRO

            Tweet: "Another mysterious NASA death as ninth scientist linked to secret programs dies"
            Name: The Silencing
            Ticker: SILENCING

            Tweet: "Seven stolen dogs go viral after escaping and making 17km journey home"
            Name: The Wandering 7
            Ticker: 7

            Tweet: "BREAKING: NVIDIA CEO announces 'we've achieved AGI'"
            Name: Artificial General Intelligence
            Ticker: AGI

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

            Tweet: "If models were drugs, 5.1 would be datura. Truly nothing else like it."
            Name: Datura
            Ticker: MODEL 5.1

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
            Ticker: Cocaine Hippo

            Tweet: "Inspiring new merch idea: rocket pocket underpants!"
            Name: Rocket Pocket Underpants
            Ticker: RPU

            Tweet: "The people cry out for retardmaxxing."
            Name: Retardmaxxing
            Ticker: RETARDMAXXING

            Tweet: "Trump might be the most stupid and retarded president I've ever seen."
            Name: Retardnald
            Ticker: RETARDNALD

            Author: @${author}
            Tweet: "${tweetText}"

            Reply in exactly this format, nothing else:
            NAME: [token name]
            TICKER: [ticker]`
        }],
        max_tokens: 30,
        temperature: 0
    });

    const content = response.choices[0].message.content.trim();
    const name = content.match(/NAME: (.+)/)?.[1]?.trim();
    const ticker = content.match(/TICKER: (.+)/)?.[1]?.trim();
    
    console.log(`  💡 Our suggestion: ${name} (${ticker})`);
    return { name, ticker };
}

async function scoreTweet(tweetText, prediction, ticker, authorsHandle) {
    const response = await groq.chat.completions.create({
        model: model,
        messages: [{
            role: "user",
            content: `You are an expert in crypto memecoin culture on Solana and crypto Twitter. You understand what makes a good memecoin on pump.fun. Remember, memecoins are based on anything that can grab a person's attention. It could be a joke, a vibe, an absurdity, a cultural moment, a viral concept, a specific image or character in the tweet, or even just the energy of the tweet distilled into a single idea. The best memecoins have a clear and specific meme core that can be easily understood and visualized.

            Rate this tweet's memecoin potential 1-10. Reply with the score first, then one short sentence explaining why.

            These tweets come from major influencers so the author already has pull.

            BEFORE SCORING — ask yourself: does this tweet contain an actual meme, joke, concept, or moment? Not just energy, not just slang, not just a famous name. Something that could become a coin with an identity. If the answer is no, the score is low regardless of everything else.

            WHAT MAKES A SCORE HIGH:
            - A real joke, meme format, or punchline — something with a setup and a payoff
            - A cultural moment, viral concept, or internet phenomenon with staying power
            - A specific, vivid, memeable idea that can become a cartoon, character, or coin identity
            - Animals with a story (cute, funny, sad, heroic)
            - Genuinely interesting or groundbreaking tech/AI/crypto news where the concept itself is the hook
            - Slang or internet culture used in a meaningful, specific way — not just dropped randomly
            - Political content with an actual angle, joke, or specific absurdity — not just a name drop
            - Financial nihilism, crypto culture, or degen energy attached to a real concept
            - Tokenization, trading, or calling something financially adjacent with a concrete idea that is not a normal concept.
            - Anything that makes you stop and react — not just nod and scroll

            WHAT MAKES A SCORE LOW:
            - Reactions and responses with no substance ("lol", "lmao", "wtf", emojis alone)
            - Insults or shade without a specific angle or famous target with an actual setup
            - Slang words or vibe alone — playful energy without a real meme underneath
            - Famous names dropped with no joke, moment, or concept attached (Trump alone is not a meme)
            - Simple catchphrases with no depth or specificity
            - Dry news, facts, or announcements with no humor, absurdity, or personality
            - Corporate or product content that lacks magnitude or a hook
            - Threads, long explanations, or link posts with nothing quotable
            - Anything where the "coin" would have no identity beyond a word or name

            Tweet: ${tweetText}
            Twitter/X handle: ${authorsHandle}
            Suggested token name: ${prediction}
            Suggested ticker: ${ticker}`
        }],
        max_tokens: 10,
        temperature: 0
    });

    // const score = parseInt(response.choices[0].message.content.trim());
    // return score;

    const scoreMatch = response.choices[0].message.content.match(/\d+/);
    const score = scoreMatch ? parseInt(scoreMatch[0]) : 0;
    // const suggestion = await generateSuggestion(tweetText, authorsHandle);
    // logToFile(tweetText, prediction, ticker, score, response.choices[0].message.content, tweetUrl, suggestion);
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

    // classify content type first
    const groqResponse = await groq.chat.completions.create({
        model: model,
        messages: [{
            role: "user",
            content: `Classify this memecoin into exactly one category. Reply with only the category name.

                PERSON - a specific real named public figure (politician, celebrity, tech CEO)
                EMOTION - the core concept is a human emotional state or mentally defined archetype (retard, doomer, coomer, depressed, angry, stupid)
                ITEM - the name ends in "coin" or refers to a specific tradeable or tokenizable asset like a memestock
                GENERAL - everything else: abstract concepts, random objects, compound ideas, animals, food, anything that doesnt fit above

                Token name: "${prediction}"
                Ticker: "${ticker}"
                Tweet: "${tweetText}"

                Reply with only: PERSON, EMOTION, ITEM, or GENERAL`
        }],
        max_tokens: 30,
        temperature: 0
    });

    const category = groqResponse.choices[0].message.content.trim().toUpperCase();

    let prompt;

    if (category === "PERSON") {
        prompt = `Using the reference image as the art style template, create a caricature of ${prediction}. 
                    Keep the same flat cartoon style, bold outlines, and slightly derpy exaggerated features from the reference. 
                    Make it recognizable as ${prediction} by capturing their most iconic physical features. 
                    Inspired by: "${tweetText}". Ticker: ${ticker}. White background, no text or words.`
    }
    else if (category === "EMOTION") {
        prompt = `Using the reference wojak image as the exact art style, redraw it to express: ${prediction}. 
                    Keep the same flat cartoon wojak face structure, bold black outlines, and simple style from the reference. 
                    Only change the expression, posture, and any small details to match the emotion of: "${tweetText}". 
                    Ticker: ${ticker}. White background, no text or words.`
    }
    else if (category === "ITEM") {
        prompt = `Using the reference image as the style template, replace the item inside the circular blob with: ${prediction} (${ticker}). 
                    Keep the same wobbly imperfect circle shape, colorful gradient border, and vibrant background style from the reference. 
                    The item should be a simple iconic drawing of the core concept from: "${tweetText}". 
                    White outer background, no text or words.`
    }
    else {
        prompt = `Create a simple iconic memecoin avatar for ${prediction} (${ticker}). 
                    The core idea comes from: "${tweetText}". 
                    Flat cartoon style, bold black outlines, vibrant colors, white background. 
                    Capture the main visual and memeable concept in the simplest most iconic way possible. No text or words. If the concept is more of a vibe or abstract idea, represent it with a simple object or character that embodies the essence of the meme with an appropriate background.`
    }

    const referenceImage = category === "EMOTION" ? WOJAK_IMAGE 
                     : category === "PERSON" ? PERSON_IMAGE 
                     : category === "ITEM" ? ITEM_IMAGE 
                     : null;

    

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
        if (!data.success) {
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

async function deployToken(name, ticker, imageBase64, tweetText, authorHandle) {
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

    const body = {
        api_key: process.env.API_KEY,
        session_id: process.env.SESSION_ID,
        axiom: false,
        type: "create_token",
        mode: "pump",
        name,
        ticker,
        image_url: imageBase64,
        image_type: null,
        buy_amount: 0.001,
        auto_sell: false,
        auto_sell_multi: true,
        sell_panel_enabled: true,
        twitter: "",
        website: ""
    };

    if (isAI) {
        body.agent_mode = true;
        body.auto_buyback_cfees = true;
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
    const handle = data.author?.handle?.toLowerCase();
    if (!WHITELIST.includes(handle)) return;

    console.log(`🐦 New tweet from @${handle}: "${data.text}"`);

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

    // generate our own suggestion instead of using j7's
    const suggestion = await generateSuggestion(tweet.text, tweet.author?.handle);
    if (!suggestion.name || !suggestion.ticker) return;

    // check 1 — image arrived while we were generating suggestion
    if (tweet.imageArrived) {
        await processWithImage(tweet);
        return;
    }

    const {score, reasoning} = await scoreTweet(tweet.text, suggestion.name, suggestion.ticker, tweet.author?.handle);

    // check 2 — image arrived while we were scoring
    if (tweet.imageArrived) {
        await processWithImage(tweet);
        return;
    }

    if (score >= 7) {
        const image = await generateImage(tweet.text, suggestion.name, suggestion.ticker, tweet);
        if (!image) return;

        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        fs.writeFileSync("generated_image.jpg", Buffer.from(base64Data, "base64"));

        logToFile(tweet.text, score, reasoning, tweet.tweetUrl, suggestion);
        const result = await deployToken(suggestion.name, suggestion.ticker, image, tweet.text, tweet.author?.handle);
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
    // describe image with llama 4 scout
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
                        text: `Describe what you see in this image in one short sentence. Focus on the main subject, mood, and any text visible. Be concise.`
                    }
                ]
            }],
            max_tokens: 100,
            temperature: 0
        });

        imageDescription = visionResponse.choices[0].message.content.trim();
    } catch (err) {
        console.log("⚠️ Image fetch failed, falling back to text only");
        const suggestion = await generateSuggestion(tweet.text, tweet.author?.handle);
        if (!suggestion.name || !suggestion.ticker) return;
        const {score, reasoning} = await scoreTweet(tweet.text, suggestion.name, suggestion.ticker, tweet.tweetUrl, tweet.author?.handle);
        if (score < 7) return;
        const image = await generateImage(tweet.text, suggestion.name, suggestion.ticker, tweet);
        if (!image) return;
        logToFile(tweet.text, score, reasoning, tweet.tweetUrl, suggestion);
        await deployToken(suggestion.name, suggestion.ticker, image, tweet.text, tweet.author?.handle);
        console.log(`  ✅ Token deployed: ${result.mint_address}`);
        console.log('ELAPSED TIME:', ((Date.now() - tweet.cachedAt) / 1000).toFixed(2), 'seconds');
        return;
    }

    // combine tweet text and image description
    const combinedText = `${tweet.text || ""} [image: ${imageDescription}]`.trim();

    // check if image arrived during vision call (shouldn't happen but just in case)
    const suggestion = await generateSuggestion(combinedText, tweet.author?.handle);
    if (!suggestion.name || !suggestion.ticker) return;

    const {score, reasoning} = await scoreTweet(combinedText, suggestion.name, suggestion.ticker, tweet.author?.handle);

    if (score < 7) {
        return;
    }

    // fetch tweet image and convert to base64
    const imgResponse = await fetch(imageUrl);
    const buffer = await imgResponse.arrayBuffer();
    const image = `data:image/jpeg;base64,${Buffer.from(buffer).toString("base64")}`;

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync("generated_image.jpg", Buffer.from(base64Data, "base64"));

    logToFile(tweet.text, score, reasoning, tweet.tweetUrl, suggestion);
    const result = await deployToken(suggestion.name, suggestion.ticker, image, combinedText, tweet.author?.handle);
    if (result.type === "token_create_success") {
        console.log(`  ✅ Token deployed: ${result.mint_address}`);
        console.log('ELAPSED TIME:', ((Date.now() - tweet.cachedAt) / 1000).toFixed(2), 'seconds');
    } else {
        console.log(`  ❌ Deploy failed:`, result.error);
    }

    tweet.processing = false;
}