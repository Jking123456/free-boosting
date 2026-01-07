import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async function handler(req, res) {
    const { pass, key, action, duration } = req.body;
    const ADMIN_KEY = "henry_admin_2026_xyz"; 

    if (pass !== ADMIN_KEY) return res.status(403).json({ message: "Forbidden" });

    try {
        if (action === 'generate') {
            const newKey = "boost_" + Math.random().toString(36).substring(2, 10);
            // Duration is now seconds (e.g., 3600 for 1 hour)
            await redis.set(`config:${newKey}`, duration); 
            return res.json({ message: "Generated", newKey });
        }
        
        if (action === 'list') {
            const keys = await redis.keys('boost_*');
            const list = [];
            for (let k of keys) {
                const ttl = await redis.ttl(k);
                list.push({ id: k, timeLeft: ttl });
            }
            return res.json({ keys: list });
        }

        if (action === 'delete') {
            await redis.del(key);
            await redis.del(`${key}_used`);
            await redis.del(`config:${key}`);
            return res.json({ message: "Deleted" });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
