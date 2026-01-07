import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: "POST only" });

    const { url, service_type, access_key } = req.body;
    const ADMIN_KEY = "henry_admin_2026_xyz"; 
    
    // Get user's IP address
    const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        let authorized = false;

        if (access_key === ADMIN_KEY) {
            authorized = true;
        } 
        else {
            const configDuration = await redis.get(`config:${access_key}`);

            if (configDuration) {
                // 1. Check IP Lock
                const lockedIP = await redis.get(`lock:${access_key}`);
                
                if (lockedIP && lockedIP !== userIP) {
                    return res.status(403).json({ 
                        success: false, 
                        message: "Key is already locked to another device!" 
                    });
                }

                const sessionActive = await redis.get(access_key);

                if (!sessionActive) {
                    const hasBeenUsed = await redis.get(`${access_key}_used`);
                    
                    if (hasBeenUsed) {
                        return res.status(401).json({ success: false, message: "Key Expired" });
                    } else {
                        // FIRST TIME ACTIVATION
                        await redis.set(access_key, "active", { ex: parseInt(configDuration) });
                        await redis.set(`${access_key}_used`, "true");
                        
                        // Set the IP lock forever for this key
                        await redis.set(`lock:${access_key}`, userIP);
                        
                        authorized = true;
                    }
                } else {
                    authorized = true;
                }
            }
        }

        if (!authorized) {
            return res.status(401).json({ success: false, message: "Invalid or Expired Access Key" });
        }

        // Forward to Boosting Service
        const response = await fetch('https://axhfreeboosting.axelhosting.xyz/api/boost', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, service_type })
        });

        const data = await response.json();
        return res.status(response.status).json(data);

    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}
