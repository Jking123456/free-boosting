import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async function handler(req, res) {
    const { pass, key, action } = req.body;
    const ADMIN_KEY = "henry_admin_2026_xyz"; // MUST match your admin key

    if (pass !== ADMIN_KEY) return res.status(403).json({ message: "Wrong Admin Password" });

    try {
        if (action === 'delete') {
            // This deletes the active session AND the "used" marker
            await redis.del(key);
            await redis.del(`${key}_used`);
            return res.json({ message: `Key ${key} has been fully reset.` });
        }
    } catch (error) {
        return res.status(500).json({ message: "Database Error" });
    }
}
