const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("Error: GEMINI_API_KEY is not set in environment or .env file.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-002",
        "gemini-2.0-flash-exp",
        "gemini-2.0-flash",
        "gemini-pro",
        "gemini-1.5-pro",
        "gemini-1.0-pro"
    ];

    console.log("Starting model connectivity test...");

    for (const modelName of models) {
        try {
            /* console.log(`\nTesting model: ${modelName}`); */
            process.stdout.write(`Testing ${modelName}: `);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            console.log(`PASS`);
            console.log(`Success! Response: ${result.response.text()}`);
            return; // Stop on first success
        } catch (error) {
            console.log(`FAIL`);
            // console.error(`Error details: ${error.message.split('\n')[0]}`);
        }
    }
    console.log("\nAll models failed.");
}

listModels();
