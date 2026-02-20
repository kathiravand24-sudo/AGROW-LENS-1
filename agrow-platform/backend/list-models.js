const https = require('https');
const dotenv = require('dotenv');

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("No API Key found");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.error(`API Request Failed: ${res.statusCode} ${res.statusMessage}`);
            console.error(data);
        } else {
            try {
                const response = JSON.parse(data);
                if (response.models) {
                    console.log("AVAILABLE_MODELS_START");
                    response.models.forEach(m => console.log(m.name));
                    console.log("AVAILABLE_MODELS_END");
                } else {
                    console.log("No models returned.");
                    console.log(data);
                }
            } catch (e) {
                console.error("Error parsing JSON:", e);
                console.log("Raw Data:", data);
            }
        }
    });
}).on('error', (e) => {
    console.error("Error making request:", e);
});
