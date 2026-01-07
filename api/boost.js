import { Redis } from '@upstash/redis'

// This connects to your database using the variables you saved in Vercel
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: "POST only" });

    // The key the customer paid for
    const PAID_KEY = "boosting_Jd137jda";
    
    // Your permanent admin keys
    const PERMANENT_KEYS = [
        "boosting_H74ajdtr", 
        "boosting_a62Hra7q", 
        "boosting_jH38vsH4"
    ];

    try {
        const { url, service_type, access_key } = req.body;

        let isAuthorized = false;

        // 1. Logic for the Paid Key
        if (access_key === PAID_KEY) {
            const expirationStatus = await redis.get(PAID_KEY);

            if (!expirationStatus) {
                // Check if it's the VERY FIRST time using it
                const hasBeenActivatedBefore = await redis.get(`${PAID_KEY}_activated`);
                
                if (!hasBeenActivatedBefore) {
                    // ACTIVATE NOW: Set 2-hour timer (7200 seconds)
                    await redis.set(PAID_KEY, "active", { ex: 7200 });
                    await redis.set(`${PAID_KEY}_activated`, "true");
                    isAuthorized = true;
                } else {
                    // It was activated before but the 7200 seconds expired
                    return res.status(401).json({ success: false, message: "Key Expired (2hrs limit reached)" });
                }
            } else {
                // Key is still within the 2-hour window
                isAuthorized = true;
            }
        } 
        // 2. Logic for Permanent Keys
        else if (PERMANENT_KEYS.includes(access_key)) {
            isAuthorized = true;
        }

        if (!isAuthorized) {
            return res.status(401).json({ success: false, message: "Invalid Access Key" });
        }

        // 3. Forward the request to the main API
        const response = await fetch('https://axhfreeboosting.axelhosting.xyz/api/boost', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, service_type })
        });

        const data = await response.json();
        return res.status(response.status).json(data);

    } catch (error) {
        console.error("Redis Error:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}
