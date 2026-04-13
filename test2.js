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