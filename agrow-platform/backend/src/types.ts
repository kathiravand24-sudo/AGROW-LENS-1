export interface User {
    id: string;
    name: string;
    phone: string;
    email?: string;
    passwordHash: string;
    role: 'farmer' | 'admin';
    farmDetails?: {
        location: string;
        crop: string;
        area: string;
    };
}

export interface Disease {
    id: string;
    crop: string;
    name: string;
    scientificName: string;
    status: 'Healthy' | 'Action Needed' | 'Critical';
    confidenceRange: [number, number];
    symptoms: string[];
    treatment: {
        organic: string;
        chemical: string;
    };
    advice: string;
}

export interface AnalysisLog {
    step: string;
    timestamp: string;
    status: 'info' | 'success' | 'warning';
}

export interface Scan {
    id: string;
    userId: string;
    imageUrl: string;
    crop: string;
    predictedDisease: string;
    scientificName?: string;
    commonName?: string;
    confidence: number;
    status: 'Healthy' | 'Action Needed' | 'Critical';
    createdAt: string;
    advice: string;
    symptoms?: string[];
    treatmentOrganic?: string;
    treatmentChemical?: string;
    analysisLogs?: AnalysisLog[];
}
export interface Product {
    id: string;
    name: string;
    type: 'mineral' | 'chemical' | 'organic';
    price: number;
    image: string;
    description: string;
    category: string;
}

export interface Purchase {
    id: string;
    userId: string;
    productId: string;
    productName: string;
    price: number;
    createdAt: string;
    status: 'ordered' | 'processing' | 'shipped' | 'in-transit' | 'out-for-delivery' | 'delivered';
    trackingId?: string;
    estimatedArrival?: string;
    logs?: Array<{
        event: string;
        location: string;
        timestamp: string;
        status: 'completed' | 'current' | 'upcoming';
    }>;
}
