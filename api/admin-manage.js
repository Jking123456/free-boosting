import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async function handler(req, res) {
    // Only allow POST requests for security
    if (req.method !== 'POST') {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { pass, key, action, duration } = req.body;
    
    // This MUST match the password you type into the admin.html
    const ADMIN_KEY = "henry_admin_2026_xyz"; 

    if (pass !== ADMIN_KEY) {
        return res.status(403).json({ success: false, message: "Invalid Admin Password" });
    }

    try {
        // --- ACTION: GENERATE NEW KEY ---
        if (action === 'generate') {
            // Generates a random 8-character string after "boost_"
            const newKey = "boost_" + Math.random().toString(36).substring(2, 10);
            
            // Duration is sent in seconds from the frontend (Hours * 3600)
            await redis.set(`config:${newKey}`, duration); 
            
            return res.json({ success: true, message: "Key Generated", newKey });
        }

        // --- ACTION: LIST ALL KEYS & STATUS ---
        if (action === 'list') {
            // Fetches all keys that start with "boost_"
            const keys = await redis.keys('boost_*'); 
            const list = [];

            for (let k of keys) {
                // Ignore the "_used" and "config" helper keys in the main list
                if (k.endsWith('_used') || k.startsWith('config:') || k.startsWith('lock:')) continue;

                const ttl = await redis.ttl(k);
                list.push({ id: k, timeLeft: ttl });
            }
            
            return res.json({ success: true, keys: list });
        }

        // --- ACTION: DELETE / RESET KEY ---
        if (action === 'delete') {
            if (!key) return res.status(400).json({ message: "No key specified" });

            // Remove all records related to this specific key
            await redis.del(key);                // Deletes active session
            await redis.del(`${key}_used`);      // Deletes "already used" marker
            await redis.del(`config:${key}`);    // Deletes the duration config
            await redis.del(`lock:${key}`);      // Clears the IP Lock for the user
            
            return res.json({ success: true, message: `Key ${key} and its IP lock have been wiped.` });
        }

        return res.status(400).json({ message: "Invalid action" });

    } catch (error) {
        console.error("Admin API Error:", error);
        return res.status(500).json({ success: false, message: "Database Error" });
    }
}
