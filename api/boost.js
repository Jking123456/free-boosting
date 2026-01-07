import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: "POST only" });

    const { url, service_type, access_key } = req.body;
    const ADMIN_KEY = "henry_admin_2026_xyz"; // Your private bypass key

    try {
        let authorized = false;
        let selectedDuration = 7200; // Default 2 hours

        // 1. Check if it's the Admin Master Key (Full Bypass)
        if (access_key === ADMIN_KEY) {
            authorized = true;
        } 
        else {
            // 2. Check if the key exists in your "Generated Keys" database
            const configDuration = await redis.get(`config:${access_key}`);

            if (configDuration) {
                selectedDuration = parseInt(configDuration);
                
                // Check if the session is currently active
                const sessionActive = await redis.get(access_key);

                if (!sessionActive) {
                    // Check if it was already used and finished
                    const hasBeenUsed = await redis.get(`${access_key}_used`);
                    
                    if (hasBeenUsed) {
                        return res.status(401).json({ success: false, message: "Key Expired" });
                    } else {
                        // FIRST TIME ACTIVATION: Set the timer based on admin setting
                        await redis.set(access_key, "active", { ex: selectedDuration });
                        await redis.set(`${access_key}_used`, "true");
                        authorized = true;
                    }
                } else {
                    // Session is still within the active time window
                    authorized = true;
                }
            }
        }

        if (!authorized) {
            return res.status(401).json({ success: false, message: "Invalid or Expired Access Key" });
        }

        // 3. Forward the request to the Boosting Service
        const response = await fetch('https://axhfreeboosting.axelhosting.xyz/api/boost', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, service_type })
        });

        const data = await response.json();
        return res.status(response.status).json(data);

    } catch (error) {
        console.error("Redis/API Error:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}
