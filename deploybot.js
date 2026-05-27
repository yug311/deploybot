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
import { suggestionSystemPrompt, suggestionUserPrompt, scoreSystemPrompt, scoreUserPrompt, historicalImagePrompt, generateImagePrompt } from './prompts.js';
export {  generateSuggestion, getHistoricalImages };


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

const model_suggestion = "openai/gpt-oss-120b"; //openai/gpt-oss-120b
const model_score = "llama-3.3-70b-versatile";
const WHITELIST = [
    "elonmusk", "pumpfun", "a1lon", "sama", "claudeai", "anthropicai", "openai", "pmarca", "nikitabier", "cobie", "solana",
    "rajgokal", "naval", "saylor", "balajis", "mert", "nasa", "jack", "toly", "polymarket", "dexerto", "bloomberg", "nypost", "washtimes", "newyorker", "dailymail"

];

const tweetCache = {};

setInterval(() => {
    const now = Date.now();
    for (const id in tweetCache)
    {
        if (now - tweetCache[id].cachedAt > 10 * 60 * 1000)
        {
            delete tweetCache[id];
        }
    }
    console.log(`🧹 Cache cleaned — ${Object.keys(tweetCache).length} tweets remaining`);
}, 5 * 60 * 1000);

async function getHistoricalImages(name, ticker, tweetText, mediaURL, signal)
{
    const numpics = mediaURL ? 4 : 5
    const params = new URLSearchParams({input: name, type: "tokens", filters: JSON.stringify({ blockchains: "solana", bondedOnly: true }), sortBy: "searchScore", excludeBonded: false, limit: numpics,});

    const response = await fetch(`https://api.mobula.io/api/2/fast-search?${params}`,
    {
        headers: { "Authorization": process.env.MOBULA_API_KEY, },
        signal,
    });

    const data = await response.json();
    if (!data.data?.length) return null;

    const imageContent = data.data
    .map(token => token.logo)
    .filter(url => url)
    .map(url => ({
        type: "image_url",
        image_url: { url }
    }));
    if (mediaURL) imageContent.unshift({ type: "image_url", image_url: { url: mediaURL } });

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
                        text: historicalImagePrompt(tweetText, name, ticker)
                    }
                ]
            }
        ],
        max_tokens: 500,
        temperature: 0
    }, { signal });

    const elapsedTimeMs = Date.now() - startTime;
    const imageDescription = visionResponse.choices[0].message.content.trim();
    const reasoning1 = visionResponse.choices[0].message.reasoning;

    if (imageDescription !== "NONE")
    {
        const selectedIndex = parseInt(imageDescription) - 1; // Convert 1-5 to 0-4
        const selectedImage = imageContent[selectedIndex].image_url.url;
        return selectedImage;
    } 

    else
    {
        console.log("No suitable image found"); //ai generate if none found
        return null;
    }
}

async function generateSuggestion(tweetText, author, signal) {

    const response = await groq.chat.completions.create({
        model: model_suggestion,
        messages: [
            {
                role: "system",
                content: suggestionSystemPrompt
            },
            {
                role: "user",
                content: suggestionUserPrompt(tweetText, author)
            },
        ],
        max_completion_tokens: 3000,
        seed: 30,
        reasoning_effort: "medium",
        temperature: 0,
    }, { signal });

    const content = response.choices[0].message.content.trim();
    const name = content.match(/NAME: (.+)/)?.[1]?.trim();
    const ticker = content.match(/TICKER: (.+)/)?.[1]?.trim();

    const reasoning1 = response.choices[0].message.reasoning;
    console.log(reasoning1);
    return { name, ticker };
}


async function scoreTweet(tweetText, authorsHandle, signal) {
    const response = await groq.chat.completions.create({
        model: model_score,
        messages: [
            {
                role: 'system',
                content: scoreSystemPrompt
            },
            {
                role: "user",
                content: scoreUserPrompt(tweetText, authorsHandle)
            }
        ],
        max_tokens: 1000,
        temperature: 0,
    }, { signal });

    const scoreMatch = response.choices[0].message.content.match(/SCORE: (\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    return {score: score, reasoning: response.choices[0].message.content.trim()};
}

async function generateImage(tweetText, prediction, ticker, signal) {

    try {
        const response = await fetch("https://nyc.j7tracker.io/api/ai-image", {
            method: "POST",
            signal: signal,
            headers: {
                "Content-Type": "application/json",
                "origin": "https://j7tracker.io",
                "referer": "https://j7tracker.io/",
                "x-session-id": process.env.SESSION_ID,
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36"
            },
            body: JSON.stringify({
                prompt: generateImagePrompt,
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
    }
    catch (err) {    
        if (err.name === "AbortError")
        {
            console.log("  ⚠️ Image generation aborted — image arrived");
        } 

        else 
        {
            console.log("❌ Image generation error:", err.message);
        }
        return null;
    }
}



async function deployToken(name, ticker, imageBase64, tweetText, authorHandle, tweetUrl, signal) {
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

    const isAI = AI_TERMS.some(term => text.includes(term) || name_lower.includes(term)) || AI_ACCOUNTS.includes(author);

    const body = {
        api_key: process.env.API_KEY,
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

    if (isAI)
    {
        body.agent_mode = true;
        body.auto_buyback_cfees = true;
        body.buyback_bps = 10000;
    }

    else
    {
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
        signal,
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

    //eliminate quick succession posts by same accoount
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
        hasMedia: data.media?.images?.length > 0
    };

    if (data.media?.images?.length > 0)
    {
        processWithImage(tweetCache[data.id]);
    } 
    else
    {
        tweetCache[data.id].processing = true;
        processTweet(data.id);
    }
});

socket.on("tweet_update", (data) => {
    const existing = tweetCache[data.id];
    if (!existing) return;

    const hasMedia = data.media?.images?.length > 0; //check if new data has media

    tweetCache[data.id] = {
        ...data,
        cachedAt: existing.cachedAt,
        processing: existing.processing,
        hasMedia: existing.hasMedia || hasMedia,
        // abortController: existing.abortController
    };

    if (hasMedia && !existing.hasMedia) {        
        if (existing.processing) {
            existing.abortController?.abort();
            tweetCache[data.id].processing = false;
            processWithImage(tweetCache[data.id]);
        }
    }
});

async function processTweet(tweetId) {

    const tweet = tweetCache[tweetId];
    if (!tweet) return;

    try {        
        const controller = new AbortController();
        tweet.abortController = controller;
        const signal = controller.signal;

        const {score, reasoning} = await scoreTweet(tweet.text, tweet.author?.handle, signal);
        console.log(tweet.text, reasoning);

        if (score >= 5)
        {
            player().play("audio.wav");

            const suggestion = await generateSuggestion(tweet.text, tweet.author?.handle, signal);
            if (!suggestion.name || !suggestion.ticker)
            {
                tweet.processing = false;
                return;
            }

            let image = await getHistoricalImages(suggestion.name, suggestion.ticker, tweet.text, null, signal);
            console.log("Historical image result:", image);

            if (!image)
            {
                image = await generateImage(tweet.text, suggestion.name, suggestion.ticker, signal);
            }

            if (!image)
            {
                tweet.processing = false;
                console.log("❌ No image available — skipping deploy");
                return;
            }

            const result = await deployToken(suggestion.name, suggestion.ticker, image, tweet.text, tweet.author?.handle, tweet.tweetUrl, signal);
            if (result.type === "token_create_success")
            {
                console.log(`  ✅ Token deployed: ${result.mint_address}`);
                console.log('ELAPSED TIME:', ((Date.now() - tweet.cachedAt) / 1000).toFixed(2), 'seconds');
            } 
            
            else
            {
                console.log(`  ❌ Deploy failed:`, result.error);
            }
        }

        else //do not set tweet.processing = false
        {
            return;
        }

        tweet.processing = false;
    } 
    
    catch (err)
    {
        if (err.name === "AbortError")
        {
            console.log("  ⚠️ Processing aborted — new media arrived");
        }
        else
        {
            console.log("❌ Processing error:", err.message);
        }
        tweet.processing = false;
    }
}

async function processWithImage(tweet) {

    //no processing flags here
    try {

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
                    }
                ],
                max_tokens: 500,
                temperature: 0
            });

            imageDescription = visionResponse.choices[0].message.content.trim();
        } 
        
        catch (err)
        {
            console.log("❌ Image description failed:", err.message, "— falling back to text only");
            imageDescription = "NONE";
        }

        const combinedText = `${tweet.text || ""} [image: ${imageDescription}]`.trim();

        const { score, reasoning } = await scoreTweet(combinedText, tweet.author?.handle);
        console.log(combinedText, reasoning);

        if (score < 5) {
            return;
        }
        player().play("audio.wav");

        const suggestion = await generateSuggestion(combinedText, tweet.author?.handle);
        if (!suggestion.name || !suggestion.ticker) {
            return;
        }

        let image = await getHistoricalImages(suggestion.name,suggestion.ticker,combinedText,imageUrl);
        console.log("Historical image result:", image);

        if (!image) {
            image = await generateImage(combinedText, suggestion.name, suggestion.ticker);
        }

        if (!image) {
            console.log("❌ No image available — skipping deploy");
            return;
        }

        const result = await deployToken(suggestion.name, suggestion.ticker, image, combinedText, tweet.author?.handle, tweet.tweetUrl);
        if (result.type === "token_create_success")
        {
            console.log(`  ✅ Token deployed: ${result.mint_address}`);
            console.log('ELAPSED TIME:', ((Date.now() - tweet.cachedAt) / 1000).toFixed(2), 'seconds');
        } 
        else
        {
            console.log(`  ❌ Deploy failed:`, result.error);
        }
    }

    catch (err)
    {
        if (err.name === "AbortError")
        {
            console.log("  ⚠️ Processing aborted — new media arrived");
        }
        else
        {
            console.log("❌ Processing error:", err.message);
        }
    }
}