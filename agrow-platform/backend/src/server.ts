import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { User, Scan, Disease, AnalysisLog, Product, Purchase } from './types';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, '../data/db.json');
const DISEASES_PATH = path.join(__dirname, '../data/diseases.json');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
console.log("GEMINI_API_KEY present:", !!GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '10mb' }));

// Helper to read DB
async function readDb() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        const parsed = JSON.parse(data);
        return {
            users: parsed.users || [],
            scans: parsed.scans || [],
            products: parsed.products || [],
            purchases: parsed.purchases || []
        } as { users: User[], scans: Scan[], products: Product[], purchases: Purchase[] };
    } catch (error) {
        return { users: [], scans: [], products: [], purchases: [] };
    }
}

// Helper to write DB
async function writeDb(data: { users: User[], scans: Scan[], products: Product[], purchases: Purchase[] }) {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// Helper to read Diseases Knowledge Base
async function readDiseases() {
    try {
        const data = await fs.readFile(DISEASES_PATH, 'utf-8');
        return JSON.parse(data) as Disease[];
    } catch (error) {
        return [];
    }
}

// Routes
app.get('/health', (req, res) => {
    res.send('AGROW Lens API is running with Universal AI Engine');
});

// Auth Login
app.post('/api/auth/login', async (req, res) => {
    const { phone, name, farmDetails } = req.body;
    const db = await readDb();
    let user = db.users.find(u => u.phone === phone);
    if (!user) {
        user = {
            id: uuidv4(),
            name: name || 'Explorer',
            phone,
            passwordHash: 'mock_hash',
            role: 'farmer',
            farmDetails: farmDetails || { location: 'Unknown', crop: 'General', area: 'Smallholder' }
        };
        db.users.push(user);
        await writeDb(db);
    }
    res.json({
        token: `mock-jwt-token-${user.id}`,
        user: { id: user.id, name: user.name, phone: user.phone, farmDetails: user.farmDetails }
    });
});

// Get Scans
app.get('/api/scans', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const userId = authHeader.replace('Bearer mock-jwt-token-', '');
    const db = await readDb();
    const userScans = db.scans.filter(s => s.userId === userId);
    res.json(userScans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

// Create Scan (UNIVERSAL AI ENGINE)
app.post('/api/scans', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const userId = authHeader.replace('Bearer mock-jwt-token-', '');
    const { imageUrl, crop: userTargetCrop } = req.body;
    const diseasesDb = await readDiseases();

    let analysisLogs: AnalysisLog[] = [
        { step: 'Initializing Universal Neural Engine...', timestamp: new Date().toISOString(), status: 'success' },
        { step: 'Activating Multi-Spectral Vision Hub...', timestamp: new Date().toISOString(), status: 'info' }
    ];

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const base64Data = imageUrl.split(',')[1];
        const mimeType = imageUrl.split(',')[0].split(':')[1].split(';')[0];

        const prompt = `You are the AGROW Lens AI. Analyze this leaf image. 
        The farmer's primary interest is ${userTargetCrop}.
        Identify:
        1. Exact Plant Species.
        2. Health Condition (Healthy, diseased, or pest attack).
        3. If diseased, identify the exact disease.
        4. Detailed remediation (Organic and Chemical).
        5. Common Name of the plant.
        
        Return ONLY a JSON object:
        {
          "identifiedCrop": "The name of the plant seen",
          "commonName": "Common local name of the plant (e.g. Neem, Tomato, Basil)",
          "condition": "Specific Name of disease or 'Healthy'",
          "scientificName": "Latin name",
          "status": "Healthy" | "Action Needed" | "Critical" | "Unknown",
          "advice": "General advice",
          "symptoms": ["list", "of", "symptoms"],
          "treatmentOrganic": "detailed organic solution",
          "treatmentChemical": "detailed chemical solution",
          "confidence": 0.0-1.0
        }`;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType } }
        ]);

        const response = await result.response;
        const text = response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("AI Vision returned invalid response code: 0xFX-JSON-ERR");

        const aiResult = JSON.parse(jsonMatch[0]);

        analysisLogs.push({
            step: `Vision Result: ${aiResult.identifiedCrop} detected (${(aiResult.confidence * 100).toFixed(1)}%). State: ${aiResult.condition}.`,
            timestamp: new Date().toISOString(),
            status: 'success'
        });

        // Search for local scientific match to override if available (Quality Assurance)
        const localMatch = diseasesDb.find(d =>
            d.crop.toLowerCase() === aiResult.identifiedCrop.toLowerCase() &&
            d.name.toLowerCase() === aiResult.condition.toLowerCase()
        );

        if (localMatch) {
            analysisLogs.push({ step: 'Validated against Scientific Knowledge Base.', timestamp: new Date().toISOString(), status: 'success' });
        } else {
            analysisLogs.push({ step: 'Dynamic Remediation synthesized via Neural Logic.', timestamp: new Date().toISOString(), status: 'info' });
        }

        const scanResult: Scan = {
            id: uuidv4(),
            userId,
            imageUrl,
            crop: aiResult.identifiedCrop,
            predictedDisease: aiResult.condition,
            scientificName: localMatch?.scientificName || aiResult.scientificName,
            commonName: aiResult.commonName,
            confidence: aiResult.confidence,
            status: localMatch?.status || aiResult.status,
            createdAt: new Date().toISOString(),
            advice: localMatch?.advice || aiResult.advice,
            symptoms: localMatch?.symptoms || aiResult.symptoms,
            treatmentOrganic: localMatch?.treatment.organic || aiResult.treatmentOrganic,
            treatmentChemical: localMatch?.treatment.chemical || aiResult.treatmentChemical,
            analysisLogs: [...analysisLogs, { step: 'Diagnostic Pack Generated.', timestamp: new Date().toISOString(), status: 'success' }]
        };

        const db = await readDb();
        db.scans.push(scanResult);
        await writeDb(db);
        return res.json(scanResult);

    } catch (error) {
        console.error("Critical Engine Error:", error);
        return res.status(500).json({ error: "AI Synthesis Error: Connection Interrupted." });
    }
});

// Get Products
app.get('/api/products', async (req, res) => {
    const db = await readDb();
    if (db.products.length === 0) {
        db.products = [
            { id: 'p1', name: 'Organic Neem Oil', type: 'organic', price: 450, image: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&q=80&w=200', description: 'Natural pest control and fungicide.', category: 'Protection' },
            { id: 'p2', name: 'High-Nitrogen Urea', type: 'chemical', price: 800, image: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&q=80&w=200', description: 'Essential mineral for leafy growth.', category: 'Fertilizer' },
            { id: 'p3', name: 'Trace Minerals Mix', type: 'mineral', price: 350, image: 'https://images.unsplash.com/photo-1592919016334-5393c833ebba?auto=format&fit=crop&q=80&w=200', description: 'Micronutrients for root health.', category: 'Nutrients' },
            { id: 'p4', name: 'Bio-Fungicide X1', type: 'organic', price: 1200, image: 'https://images.unsplash.com/photo-1589152144820-692b189e0b34?auto=format&fit=crop&q=80&w=200', description: 'Advanced fungal control for organic farms.', category: 'Protection' }
        ];
        await writeDb(db);
    }
    res.json(db.products);
});

// Get Purchase History
app.get('/api/purchases', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const userId = authHeader.replace('Bearer mock-jwt-token-', '');
    const db = await readDb();
    const userPurchases = (db.purchases || []).filter(p => p.userId === userId);
    res.json(userPurchases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

// Create Purchase
app.post('/api/purchases', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const userId = authHeader.replace('Bearer mock-jwt-token-', '');
    const { productId, productName, price } = req.body;

    const db = await readDb();
    const purchaseId = uuidv4();
    const trackingId = `AG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // Seed estimated arrival (3 days from now)
    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + 3);

    const purchase: Purchase = {
        id: purchaseId,
        userId,
        productId,
        productName,
        price,
        createdAt: new Date().toISOString(),
        status: 'ordered',
        trackingId,
        estimatedArrival: arrivalDate.toISOString(),
        logs: [
            { event: 'Order Secured', location: 'System Origin', timestamp: new Date().toISOString(), status: 'completed' },
            { event: 'Awaiting Hub Intake', location: 'Agrow Central Hub', timestamp: new Date().toISOString(), status: 'current' },
            { event: 'Neural Safety Validation', location: 'Biometric Checkpoint', timestamp: 'Upcoming', status: 'upcoming' },
            { event: 'Drone Fleet Dispatch', location: 'Transit Stratosphere', timestamp: 'Upcoming', status: 'upcoming' }
        ]
    };
    if (!db.purchases) db.purchases = [];
    db.purchases.push(purchase);
    await writeDb(db);
    res.json(purchase);
});

app.listen(PORT, () => {
    console.log(`Universal AI Server online at port ${PORT}`);
});
