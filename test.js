import { io } from "socket.io-client";
import fs from "fs";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const model = "moonshotai/kimi-k2-instruct"; // "llama-3.3-70b-versatile", moonshotai/kimi-k2-instruct, qwen/qwen3-32b, openai/gpt-oss-120b



const WHITELIST = [
    "elonmusk", "pmarca", "solana", "pumpfun", "toly", "aeyakovenko",
    "a1lon9", "rajgokal", "pumpfun", "solana", "anthropicai", "openai",
     "sama", "vitalikbuterin", "saylor", "naval",  "jack", "nvidia", "sundarpichai", "satyanadella", "tim_cook", "jeffbezos", "billgates",
     "dogecoin", "nasa", "dexerto", "dailymail", "nypost", "popcrave", "nikitabier", 
];

const WOJAK_IMAGE = `data:image/webp;base64,${fs.readFileSync("wojak.webp").toString("base64")}`;
const PERSON_IMAGE = `data:image/webp;base64,${fs.readFileSync("carciature.webp").toString("base64")}`;
const ITEM_IMAGE = `data:image/webp;base64,${fs.readFileSync("memestock.webp").toString("base64")}`;

const tweetCache = {};

async function generateSuggestion(tweetText, author) {

    const response = await groq.chat.completions.create({
        model: model,
        messages: [{
            role: "user",
            content: `You are a crypto memecoin expert on Solana. Based on this tweet, suggest a memecoin name and ticker.

            Rules:
            - Name: max 32 characters. Correct capitalization. Extract the single most important concept from the tweet — the core noun, subject, or memeable idea. Not a summary of the tweet, just the punchiest most essential part. If it's a meme, the memeable part. If it's about a person, the person. If it's an event, the most iconic word or phrase from it.
            - Ticker: max 13 characters, all caps, no spaces. Priority order: (1) use the full name if it fits in 13 chars, (2) if the name is a single word, use that word, (3) if the name is a funny/absurd multi-word phrase where no single word captures the full joke, use initials of all significant words, (4) if the name is a descriptive multi-word phrase where a few words clearly represent the main idea, use those words. The ticker should feel natural — either instantly recognizable or a clean abbreviation of the name and a short representation of the entire concept.


            Special naming patterns — apply these when relevant:
            - PRESIDENT/POLITICAL LEADER: ticker = [FIRST LETTER]OTUS (e.g. ROTUS, DOTUS), name = full acronym spelled out (e.g. "Retard Of The United States")
            - ANIMAL or HUMAN WITH SAD STORY: name = "Justice For [Animal/Human]", ticker = animal/human name
            - ANIMAL or HUMAN WITH FUN STORY: name and ticker = animal/human name
            - EMERGING TREND/NEW THING PEOPLE ARE DOING: name and ticker = [thing] + "ify" (e.g. Grokify, GROKIFY)
            - TRADING/COINS/TOKENS (stock dumping, trading like memecoin, gold pumping etc): name and ticker = [thing] + "coin" (e.g. Goldcoin, GOLDCOIN)
            - MOCKING SOMEONE (calling them stupid, retarded, degenerate, making fun of them): misspell the mocked person's name in a funny way, usually by changing vowels but sometimes consonants too. Keep it recognizable but intentionally wrong. Examples: Baron Trump → Barun Tremp, Elon Musk → Elun Musk, Melania Trump → Melunia Twemp, Bernie Sanders → Burnie Sandurs. Name and ticker should both use the misspelled version.


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

async function scoreTweet(tweetText, prediction, ticker, tweetUrl, authorsHandle) {
    const response = await groq.chat.completions.create({
        model: model,
        messages: [{
            role: "user",
            content: `You are an expert in crypto memecoin culture on Solana and crypto Twitter. You understand what makes a good memecoin on pump.fun.

            Rate this tweet's memecoin potential 1-10. Reply with the score first, then one short sentence explaining why.

            These tweets come from major influencers so the author already has pull. 

            GOOD memecoin content:
            - can be playful or funny
            - humorous (edgy, dark, derogatory)
            - Animals with cute, funny, sad, or interesting stories
            - Memeable and internet culturally relevant slang/expressions (aura, cooked, based, redpilled, goon)
            - Tech and AI advancements, products, announcements or failures that are interesting, groundbreaking, or funny.
            - Internet memes (pepe, wojak, doge, cat memes)
            - Crypto culture (ngmi, wagmi, gm, lfg, degen, rekt)
            - Political memes, libertarian ideas, financial nihilism (number go up, money printer, mooning, bull/bear, HODL, Lambo, diamond hands, weak hands, FUD, FOMO, apes, degenerates), funny financial memes
            - Anything short, punchy, and visually imaginable as a cartoon character
            - Viral moments, funny observations, anything that makes you laugh or react
            - Important and interesting breaking announcements and news or newly emerging trends
            - Does NOT need to be crypto related — just funny, weird, breaking or culturally interesting

            BAD memecoin content:
            - Dry news or science facts with no humor or personality
            - General tweets about products, technology that lack magnitude or humor
            - Boring conversations / general tweets with no interesting content
            - Boring corporate announcements
            - Tweets with links to articles
            - Long explanations or threads with no interesting concepts
            - Mundane observations with no punch
            - Simple interactions / comments (even if they are short)

            Tweet: ${tweetText}
            Twitter/X handle: ${authorsHandle}
            Suggested token name: ${prediction}
            Suggested ticker: ${ticker}`
        }],
        max_tokens: 100,
        temperature: 0
    });

    // const score = parseInt(response.choices[0].message.content.trim());
    // return score;

    const scoreMatch = response.choices[0].message.content.match(/\d+/);
    const score = scoreMatch ? parseInt(scoreMatch[0]) : 0;
    const suggestion = await generateSuggestion(tweetText, authorsHandle);
    logToFile(tweetText, prediction, ticker, score, response.choices[0].message.content, tweetUrl, suggestion);
    return score;
}

function logToFile(tweet, prediction, ticker, score, reasoning, tweetUrl, suggestion    ) {
    const entry = {
        tweet: tweet,
        prediction,
        ticker,
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
    console.log(`  💾 Logged to ${filename}`);
}

async function generateImage(tweetText, prediction, ticker) {

    // classify content type first
    const groqResponse = await groq.chat.completions.create({
        model: model,
        messages: [{
            role: "user",
            content: `Classify this memecoin into exactly one category. Reply with only the category name.

                PERSON - a specific real named public figure (politician, celebrity, tech CEO)
                EMOTION - the core concept is a human emotional state or mentally defined archetype (retard, doomer, coomer, depressed, angry, stupid)
                ITEM - the name ends in "coin" or refers to a specific tradeable asset like a memestock
                GENERAL - everything else: abstract concepts, random objects, compound ideas, animals, food, anything that doesnt fit above

                Token name: "${prediction}"
                Ticker: "${ticker}"
                Tweet: "${tweetText}"

                Reply with only: PERSON, EMOTION, ITEM, or GENERAL`
        }],
        max_tokens: 10,
        temperature: 0
    });

    const category = groqResponse.choices[0].message.content.trim().toUpperCase();
    console.log(`  🎨 Image category: ${category}`);

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
                    Capture the main visual concept in the simplest most iconic way possible. No text.`
    }

    const referenceImage = category === "EMOTION" ? WOJAK_IMAGE 
                     : category === "PERSON" ? PERSON_IMAGE 
                     : category === "ITEM" ? ITEM_IMAGE 
                     : null;

    
    const response = await fetch("https://nyc.j7tracker.io/api/ai-image", {
        method: "POST",
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

    console.log(`  🎨 Image generated in ${data.elapsed}s`);
    return data.image; // base64 image
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
        type: "create_token",
        mode: "pump",
        name,
        ticker,
        image_url: imageBase64,
        image_type: null,
        buy_amount: 0.001,
        auto_sell: false,
        auto_sell_multi: true,
        axiom: false,
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
    // if (!WHITELIST.includes(handle)) return;
    if (data.media?.images?.length > 0 || data.media?.videos?.length > 0) return;
    if (!data.text) return;

    tweetCache[data.id] = {...data, cachedAt: Date.now()};
});

socket.on("ai_suggestion", async (data) => {
    const tweet = tweetCache[data.tweet_id];
    if (!tweet) return;

    console.log("ELAPSED SUGGESTION:", ((Date.now() - tweet.cachedAt) / 1000).toFixed(2), "s");

    const score = await scoreTweet(tweet.text, data.prediction, data.ticker, tweet.tweetUrl, tweet.author?.handle);
    // const score = 9; // for testing

    console.log("ELAPSED SCORE:", ((Date.now() - tweet.cachedAt) / 1000).toFixed(2), "s");


    if (score >= 7) {

        const image = await generateImage(tweet.text, data.prediction, data.ticker);
        if (!image) return;
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        fs.writeFileSync("generated_image.jpg", Buffer.from(base64Data, "base64"));

        console.log("ELAPSED IMAGE:", ((Date.now() - tweet.cachedAt) / 1000).toFixed(2), "s");


        // next step: deploy
        const result = await deployToken(data.prediction, data.ticker, image, tweet.text, tweet.author?.handle);
        if (result.type === "token_create_success") {
            console.log(`  ✅ Token deployed: ${result.mint_address}`);

            console.log("ELAPSED DEPLOY:", ((Date.now() - tweet.cachedAt) / 1000).toFixed(2), "s");
        } else {
            console.log(`  ❌ Deploy failed:`, result.error);
        }
    }
});


// var text = "Stray dog ‘Buck’ — whose head was stuck in bucket — rescued after huge search for poor pup"
// var prediction = "buck";
// var ticker = "buck";

// scoreTweet(text, prediction, ticker, "https://twitter.com/example/status/1234567890")
// console.log(generateSuggestion(text, "dailymail"));

// text = "he is retardmaxxing"
// prediction = "retardmaxxing"
// ticker = "retardmaxxing"

// scoreTweet(text, prediction, ticker, "https://twitter.com/example/status/1234567890")
// console.log(generateSuggestion(text, "elonmusk"));

// text =  "Inspiring new merch idea: rocket pocket underpants! 🚀 🩳 Underpants with a handy pocket for your rocket, which contains a real scale model rocket with an easy pull out ability. Guaranteed to be a hit at parties!"
// prediction =  "rocket pocket underpants"
// ticker =  "rpu"

// scoreTweet(text, prediction, ticker, "https://twitter.com/example/status/1234567890")
// console.log(generateSuggestion(text, "pumpfun"));

// text = "markets go down. shibes: this is fine"
// prediction = "this is fine"
// ticker = "fine"

// scoreTweet(text, prediction, ticker, "https://twitter.com/example/status/1234567890")
// console.log(generateSuggestion(text, "dogecoin"));

// text = "missandra has become the first billion dollar vibe coded company"
// prediction = "missandra"
// ticker = "missandra"

// scoreTweet(text, prediction, ticker, "https://twitter.com/example/status/1234567890")
// console.log(generateSuggestion(text, "naval"));


// text = "yes"
// prediction = "Boost Juice"
// ticker = "BJ"

// scoreTweet(text, prediction, ticker, "https://twitter.com/example/status/1234567890", "aeyakovenko")
// console.log(generateSuggestion(text, "aeyakovenko"));

// text = "@shek_dev it's a framework that 10xes foundation's flagship product, only we stop developing it in public because they can't help but \"compete\" with us by having LLMs steal our work and lying about the results."
// prediction = "10x"
// ticker = "10X"

// scoreTweet(text, prediction, ticker, "https://twitter.com/example/status/1234567890", "aeyakovenko")
// console.log(generateSuggestion(text, "aeyakovenko"));

// text = "The most underrated thing in AI agents right now is: OpenClaw/Hermes Agent is just more free than other locked down AI agents (the standard out-of-box Claude/ChatGPT route)\n\n\"Free the Claw\" is not a vibe I understood until I tried it. Now that I have it, I don't want to go back."
// prediction = "Free the Claw"
// ticker = "FREE"

// scoreTweet(text, prediction, ticker, "https://twitter.com/example/status/1234567890", "aeyakovenko")
// console.log(generateSuggestion(text, "aeyakovenko"));


// text = "OpenAI should probably bite the bullet and just name their next set of models something more human sounding.\n\nEveryone anthropomorphizes their AIs anyway, and \"Claude\" is an easier name to refer to than ChatGPT. Also easier to make a gerund, \"Clauding,\" or adjective, \"Claudy-y.\""
// prediction = "Claudy-y"
// ticker = "CLAUDY Y"

// scoreTweet(text, prediction, ticker, "https://twitter.com/example/status/1234567890", "aeyakovenko")
// console.log(generateSuggestion(text, "aeyakovenko"));

// text = "From this perspective, Gemini is also worse than the original Bard.\n\nSydney was the original sin of LLMs anthropormism, but also got the idea that AIs can sometimes be better with personalities right. Even if that personality was unhinged."
// prediction = "Sydney"
// ticker = "SYD"

// scoreTweet(text, prediction, ticker, "https://twitter.com/example/status/1234567890", "aeyakovenko")
// console.log(generateSuggestion(text, "aeyakovenko"));