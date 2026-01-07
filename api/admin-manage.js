import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async function handler(req, res) {
    const { pass, key, action, duration } = req.body;
    const ADMIN_KEY = "henry_admin_2026_xyz"; 

    if (pass !== ADMIN_KEY) return res.status(403).json({ message: "Wrong Admin Password" });

    try {
        // ACTION: GENERATE NEW KEY
        if (action === 'generate') {
            const newKey = "boost_" + Math.random().toString(36).substring(2, 10);
            // We store the duration (seconds) in a helper key so the logic knows how long to set the TTL later
            await redis.set(`config:${newKey}`, duration || 7200); 
            return res.json({ message: "Key Generated", newKey });
        }

        // ACTION: LIST ALL KEYS
        if (action === 'list') {
            const keys = await redis.keys('boost_*'); // Finds all keys starting with boost_
            const list = [];
            for (let k of keys) {
                const ttl = await redis.ttl(k);
                list.push({ id: k, timeLeft: ttl });
            }
            return res.json({ keys: list });
        }

        // ACTION: DELETE/RESET
        if (action === 'delete') {
            await redis.del(key);
            await redis.del(`${key}_used`);
            await redis.del(`config:${key}`);
            return res.json({ message: `Key ${key} deleted.` });
        }
    } catch (error) {
        return res.status(500).json({ message: "Database Error" });
    }
}
