import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const testImageUrl = "https://pbs.twimg.com/media/HFvuAwUXYAAnxLu.jpg"; // paste a real tweet image URL here

const response = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [{
        role: "user",
        content: [
            {
                type: "image_url",
                image_url: { url: testImageUrl }
            },
            {
                type: "text",
                text: "Describe what you see in this image in one sentence."
            }
        ]
    }],
    max_tokens: 100,
    temperature: 0
});

console.log(response.choices[0].message.content);





// const testTweets = [
//                     { author: "elonmusk", text: "Inspiring new merch idea: rocket pocket underpants!" },

//                 { author: "elonmusk", text: "Grok can now see, hear, and feel. What have we done." },
//                             { author: "unusual_whales", text: "Silver is trading like a memecoin today. Up 40% in 24 hours." },
//                 { author: "unusual_whales", text: "GameStop is up 200% today and nobody can explain why" },


//             { author: "elonmusk", text: "The simulation is definitely running low on ram" },

//                 { author: "nypost", text: "Melania Trump caught on camera rolling her eyes at Biden during state dinner" },

//         {author: "cnn", text: "BREAKING: donald trump posts ai image of himself as a gladiator riding a lion"},

//         {author: "culturecrave", text: "elon musk shows up to meeting with a sink again and refuses to explain why"},

//                         { author: "a1lon", text: "neet & pumpcade are great examples of why paying attention to all corners of pump is +EV both outperformed recently despite one of them making viral memes for the unemploids and the other building prediction markets from the ground up we're far from realizing pump's mission but it's rewarding to see polar opposites thriving in the bear market" },


//     {author: "vice", text: "people are now 'bedrotting' as a lifestyle and calling it self care"},
//     {author: "wired", text: "It is official. $BRR is going to be the first publicly traded agentic finance firm. The deal will close in early April and then we will begin talking about our AI model and agent lab focused on finance. The team is working hard and we are excited to start sharing more."},
//     {author: "globeandmail", text: "Relaxation of U.S. day-trading rules opens door to YOLO trading, higher risk  "},
//             { author: "sama", text: "we have achieved AGI internally. announcement coming soon." },
//             { author: "elonmusk", text: "we're so back" },
//     {author: "watcherguru", text: "BREAKING: traders are now buying coins based on dreams they had while sleeping"},
//     {author: "insider", text: "woman names her pet rock steve and throws it a birthday party every year"},





//     { author: "elonmusk", text: "Biden is the most confused president in history lmao" },
//     { author: "peta", text: "A golden retriever named Biscuit was found abandoned in the snow, but survived after walking 30 miles home" },
//     { author: "bbcnews", text: "Beloved therapy dog Max passes away after 15 years of service at children's hospital" },

//     // MEME CORE DETECTION

//     // CRYPTO/FINANCE
//     { author: "pumpfun", text: "1 billion tokens launched. The era of infinite memecoins has begun." },

//     // TECH/AI
//     { author: "nvidia", text: "Introducing the GB200: 1000x faster than the human brain at math" },

//     // ABSURD/VIRAL
//     { author: "elonmusk", text: "I ate a live cockroach on a dare. It tasted like chicken." },

//     {author: "dexerto", text: "new trend where people are rating strangers aura levels in public is going viral"},
//     {author: "bbcnews", text: "cat named biscuit somehow boarded a plane and flew to another country alone"},
//     {author: "dexerto", text: "people are now pretending to be npcs in real life and only speaking when tipped"},
//     {author: "foxnews", text: "BREAKING: donald trump says he would 'absolutely win' a fight against a kangaroo"},
//     {author: "verge", text: "new ai tool lets you generate your future self and people are becoming obsessed with it"},
//     {author: "watcherguru", text: "BREAKING: gold just hit an all time high as markets panic"},
//     {author: "coindesk", text: "new crypto meta where people are launching coins based on random words is exploding"},
//     {author: "theverge", text: "BREAKING: mark zuckerberg unveils hyper realistic ai clone that can replace you in meetings"},
//     {author: "nhknews", text: "dog refuses to move from train station after owner passed away"},
//     {author: "reuters", text: "BREAKING: government confirms they lost track of a high altitude balloon again"},
//     {author: "watcherguru", text: "elon musk tweets 'hmm' and crypto markets instantly react"},
//     {author: "bloomberg", text: "BREAKING: oil prices surge 50 percent overnight"},
//     {author: "dexerto", text: "new trend where people only communicate in emojis for entire day"},
//     {author: "coindesk", text: "BREAKING: bitcoin crashes 30 percent in minutes wiping out billions"},

// ];

// async function runTests() {
//     for (const test of testTweets) {
//         const { name, ticker, mode} = await generateSuggestion(test.text, test.author);
//         console.log(`\n📝 @${test.author}: "${test.text}"`);
//         console.log(`   NAME: ${name}`);
//         console.log(`   TICKER: ${ticker}`);
//         console.log(`   MODE: ${mode}`);
//         await new Promise(resolve => setTimeout(resolve, 2000));
//     }
// }

// runTests();